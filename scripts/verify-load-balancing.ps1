<#
.SYNOPSIS
    PulseFIT AI - Milestone 3: Runtime Load Balancing Verification Script
.DESCRIPTION
    Verifies that requests to Member Service routed through API Gateway (port 8080)
    are load-balanced across multiple Member Service instances (8082 and 8085).
    Reads the diagnostic response header 'X-Handled-By-Port' from each response.
.PARAMETER GatewayUrl
    Base URL of the API Gateway (default: http://localhost:8080)
.PARAMETER EurekaUrl
    Base URL of Eureka Discovery Server (default: http://localhost:8761)
.PARAMETER RequestCount
    Total number of requests to dispatch through the Gateway (default: 20)
.PARAMETER Username
    Authentication username (default: admin)
.PARAMETER Password
    Authentication password (default: admin123)
.PARAMETER AuthToken
    Optional pre-generated JWT Bearer token
.PARAMETER FailOnSingleInstance
    Whether the script should fail if only one instance responds (default: $true)
.PARAMETER DelayMs
    Delay in milliseconds between requests (default: 100)
#>

[CmdletBinding()]
param (
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$EurekaUrl = "http://localhost:8761",
    [int]$RequestCount = 20,
    [string]$Username = "admin",
    [string]$Password = "admin123",
    [string]$AuthToken = "",
    [bool]$FailOnSingleInstance = $true,
    [int]$DelayMs = 100
)

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " PulseFIT AI - Runtime Load Balancing Verification" -ForegroundColor Cyan
Write-Host " Target Gateway : $GatewayUrl" -ForegroundColor Cyan
Write-Host " Eureka Server  : $EurekaUrl" -ForegroundColor Cyan
Write-Host " Total Requests : $RequestCount" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# Step 1: Inspect Eureka Discovery Registry for MEMBER-SERVICE instances
# -----------------------------------------------------------------------------
Write-Host "[Step 1/4] Inspecting Eureka Registry for MEMBER-SERVICE instances..." -ForegroundColor Yellow
$discoveredInstances = @()
try {
    $eurekaResponse = Invoke-RestMethod -Uri "$EurekaUrl/eureka/apps/MEMBER-SERVICE" `
        -Headers @{ "Accept" = "application/json" } -Method Get -TimeoutSec 5 -ErrorAction Stop

    if ($eurekaResponse.application -and $eurekaResponse.application.instance) {
        $instances = $eurekaResponse.application.instance
        # Handle single instance vs array
        if (-not ($instances -is [System.Array])) {
            $instances = @($instances)
        }
        foreach ($inst in $instances) {
            $portVal = if ($inst.port.'$') { $inst.port.'$' } else { $inst.port }
            $discoveredInstances += [PSCustomObject]@{
                InstanceId = $inst.instanceId
                Host       = $inst.hostName
                Port       = [string]$portVal
                Status     = $inst.status
            }
        }
    }
} catch {
    Write-Warning "Could not query Eureka at $EurekaUrl/eureka/apps/MEMBER-SERVICE: $_"
}

if ($discoveredInstances.Count -eq 0) {
    Write-Host "  [WARN] No MEMBER-SERVICE instances returned by Eureka at $EurekaUrl." -ForegroundColor Yellow
    Write-Host "         The script will proceed to test the Gateway directly." -ForegroundColor Yellow
} else {
    Write-Host "  Found $($discoveredInstances.Count) registered instance(s) in Eureka:" -ForegroundColor Green
    foreach ($inst in $discoveredInstances) {
        Write-Host "    - Instance ID: $($inst.InstanceId) | Port: $($inst.Port) | Status: $($inst.Status)" -ForegroundColor Green
    }
    if ($discoveredInstances.Count -lt 2) {
        Write-Host "  [WARN] Less than 2 instances registered in Eureka! Both 8082 and 8085 should be registered." -ForegroundColor Yellow
    }
}
Write-Host ""

# -----------------------------------------------------------------------------
# Step 2: Authenticate and obtain JWT Bearer Token
# -----------------------------------------------------------------------------
Write-Host "[Step 2/4] Obtaining JWT Bearer Token..." -ForegroundColor Yellow
$jwt = $AuthToken

if ([string]::IsNullOrWhiteSpace($jwt)) {
    try {
        $loginPayload = @{
            username = $Username
            password = $Password
        } | ConvertTo-Json

        $loginResponse = Invoke-RestMethod -Uri "$GatewayUrl/api/auth/login" `
            -Method Post `
            -Body $loginPayload `
            -ContentType "application/json" `
            -TimeoutSec 10 `
            -ErrorAction Stop

        if ($loginResponse.token) {
            $jwt = $loginResponse.token
            Write-Host "  [OK] Authenticated successfully as '$Username'." -ForegroundColor Green
            Write-Host "  Token prefix: $($jwt.Substring(0, [Math]::Min(25, $jwt.Length)))..." -ForegroundColor Gray
        } else {
            throw "Login response did not contain a 'token' property."
        }
    } catch {
        Write-Host "  [ERROR] Failed to obtain JWT token via $GatewayUrl/api/auth/login" -ForegroundColor Red
        Write-Host "          Details: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Troubleshooting:" -ForegroundColor Yellow
        Write-Host "    1. Verify Auth Service is running on port 8081." -ForegroundColor Yellow
        Write-Host "    2. Verify API Gateway is routing /api/auth/** to Auth Service." -ForegroundColor Yellow
        Write-Host "    3. Or pass an existing token via: -AuthToken '<token>'" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  [OK] Using provided AuthToken." -ForegroundColor Green
}
Write-Host ""

# -----------------------------------------------------------------------------
# Step 3: Dispatch requests through Gateway and record X-Handled-By-Port
# -----------------------------------------------------------------------------
Write-Host "[Step 3/4] Dispatching $RequestCount GET requests to $GatewayUrl/api/members..." -ForegroundColor Yellow

$portCounts = @{
    "8082"  = 0
    "8085"  = 0
    "Other" = 0
}
$otherPortsFound = @{}
$successfulRequests = 0
$failedRequests = 0

$headers = @{
    "Authorization" = "Bearer $jwt"
    "Accept"        = "application/json"
}

for ($i = 1; $i -le $RequestCount; $i++) {
    $paddedIdx = $i.ToString("D2")
    try {
        $response = Invoke-WebRequest -Uri "$GatewayUrl/api/members" `
            -Headers $headers `
            -Method Get `
            -UseBasicParsing `
            -TimeoutSec 10 `
            -ErrorAction Stop

        $statusCode = $response.StatusCode

        # Extract X-Handled-By-Port header (case-insensitive lookup)
        $handledPort = $null
        foreach ($key in $response.Headers.Keys) {
            if ($key -like "X-Handled-By-Port*") {
                $handledPort = $response.Headers[$key]
                if ($handledPort -is [System.Array]) {
                    $handledPort = $handledPort[0]
                }
                break
            }
        }

        if (-not $handledPort) {
            $handledPort = "MISSING_HEADER"
        }

        $handledPortStr = [string]$handledPort

        if ($handledPortStr -eq "8082") {
            $portCounts["8082"]++
            Write-Host "  [Req $paddedIdx/$RequestCount] HTTP $statusCode OK -> Handled by Instance 1 (Port :8082)" -ForegroundColor Cyan
        } elseif ($handledPortStr -eq "8085") {
            $portCounts["8085"]++
            Write-Host "  [Req $paddedIdx/$RequestCount] HTTP $statusCode OK -> Handled by Instance 2 (Port :8085)" -ForegroundColor Green
        } else {
            $portCounts["Other"]++
            if (-not $otherPortsFound.ContainsKey($handledPortStr)) {
                $otherPortsFound[$handledPortStr] = 0
            }
            $otherPortsFound[$handledPortStr]++
            Write-Host "  [Req $paddedIdx/$RequestCount] HTTP $statusCode OK -> Handled by Port: $handledPortStr" -ForegroundColor Yellow
        }

        $successfulRequests++
    } catch {
        $failedRequests++
        Write-Host "  [Req $paddedIdx/$RequestCount] Request FAILED: $_" -ForegroundColor Red
    }

    if ($DelayMs -gt 0 -and $i -lt $RequestCount) {
        Start-Sleep -Milliseconds $DelayMs
    }
}
Write-Host ""

# -----------------------------------------------------------------------------
# Step 4: Summary & Verification Analysis
# -----------------------------------------------------------------------------
Write-Host "[Step 4/4] Load Balancing Summary Report" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor Gray
Write-Host " Total Requests Sent : $RequestCount"
Write-Host " Successful Requests : $successfulRequests"
Write-Host " Failed Requests     : $failedRequests"
Write-Host ""

$pct8082 = if ($successfulRequests -gt 0) { [Math]::Round(($portCounts["8082"] / $successfulRequests) * 100, 1) } else { 0 }
$pct8085 = if ($successfulRequests -gt 0) { [Math]::Round(($portCounts["8085"] / $successfulRequests) * 100, 1) } else { 0 }

Write-Host " Instance Distribution:" -ForegroundColor White
Write-Host "   Instance 1 (Port 8082) : $($portCounts["8082"]) requests ($pct8082%)" -ForegroundColor Cyan
Write-Host "   Instance 2 (Port 8085) : $($portCounts["8085"]) requests ($pct8085%)" -ForegroundColor Green
if ($portCounts["Other"] -gt 0) {
    Write-Host "   Other / Unknown Ports  : $($portCounts["Other"]) requests" -ForegroundColor Yellow
    foreach ($entry in $otherPortsFound.GetEnumerator()) {
        Write-Host "     - Port $($entry.Key): $($entry.Value)" -ForegroundColor Yellow
    }
}
Write-Host "----------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Load Balancing Validation
$bothInstancesActive = ($portCounts["8082"] -gt 0) -and ($portCounts["8085"] -gt 0)

if ($bothInstancesActive) {
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] Runtime Load Balancing Verified!" -ForegroundColor Green
    Write-Host " Requests were successfully distributed across Instance 1 (:8082) and Instance 2 (:8085)." -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
    exit 0
} else {
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host " [FAILURE] Load Balancing Verification Incomplete!" -ForegroundColor Red
    if ($portCounts["8082"] -eq 0 -and $portCounts["8085"] -eq 0) {
        Write-Host " Neither instance (:8082 nor :8085) responded with the X-Handled-By-Port header." -ForegroundColor Red
    } elseif ($portCounts["8082"] -eq 0) {
        Write-Host " Instance 1 (port 8082) received ZERO requests. Only Instance 2 (:8085) responded." -ForegroundColor Red
    } elseif ($portCounts["8085"] -eq 0) {
        Write-Host " Instance 2 (port 8085) received ZERO requests. Only Instance 1 (:8082) responded." -ForegroundColor Red
    }
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Diagnostics & Recommended Actions:" -ForegroundColor Yellow
    Write-Host "  1. Check Eureka Dashboard at $EurekaUrl" -ForegroundColor Yellow
    Write-Host "     Confirm that MEMBER-SERVICE shows (2) instances: 8082 and 8085." -ForegroundColor Yellow
    Write-Host "  2. Ensure Instance 2 was started with: --server.port=8085 or --spring.profiles.active=replica" -ForegroundColor Yellow
    Write-Host "  3. Wait ~5-10 seconds for API Gateway's LoadBalancer cache to pick up both instances." -ForegroundColor Yellow
    Write-Host "  4. Check that both instances share the same spring.application.name = member-service." -ForegroundColor Yellow
    Write-Host ""

    if ($FailOnSingleInstance) {
        exit 1
    } else {
        Write-Host "[INFO] FailOnSingleInstance is disabled. Exiting with code 0." -ForegroundColor Gray
        exit 0
    }
}
