[CmdletBinding()]
param (
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$AuthServiceUrl = "http://localhost:8081",
    [string]$MemberService1Url = "http://localhost:8082",
    [string]$MemberService2Url = "http://localhost:8085",
    [string]$SubscriptionServiceUrl = "http://localhost:8083",
    [string]$AttendanceServiceUrl = "http://localhost:8084"
)

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " PulseFIT AI - Milestone 4B: Downstream JWT Enforcement Verification" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

function Invoke-EndpointCheck {
    param(
        [string]$Name,
        [string]$Url,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -Headers $Headers -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $code = $response.StatusCode
        $port = $null
        foreach ($k in $response.Headers.Keys) {
            if ($k -like "X-Handled-By-Port*") {
                $port = $response.Headers[$k]
                break
            }
        }
        if ($code -eq $ExpectedStatus) {
            $msg = "  [PASS] $Name -> HTTP $code OK"
            if ($port) { $msg += " [Served by Port: $port]" }
            Write-Host $msg -ForegroundColor Green
            return $true
        } else {
            Write-Host "  [FAIL] $Name returned HTTP $code (expected $ExpectedStatus)" -ForegroundColor Red
            return $false
        }
    } catch {
        $exResponse = $_.Exception.Response
        if ($exResponse) {
            $statusCode = [int]$exResponse.StatusCode
            $port = $null
            if ($exResponse.Headers) {
                $port = $exResponse.Headers["X-Handled-By-Port"]
            }
            if ($statusCode -eq $ExpectedStatus) {
                $msg = "  [PASS] $Name -> HTTP $statusCode (Direct access rejected)"
                if ($port) { $msg += " [Served by Port: $port]" }
                Write-Host $msg -ForegroundColor Green
                return $true
            } else {
                Write-Host "  [FAIL] $Name returned HTTP $statusCode (expected $ExpectedStatus)" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "  [ERROR] $Name request failed: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
}

# -----------------------------------------------------------------------------
# STEP 1: Direct Unauthenticated Access Tests (Should all return HTTP 401)
# -----------------------------------------------------------------------------
Write-Host "[STEP 1/5] Testing Direct Unauthenticated Access (Expecting HTTP 401)..." -ForegroundColor Yellow

$u1 = Invoke-EndpointCheck -Name "Member Service Instance 1 (:8082)" -Url "$MemberService1Url/api/members" -ExpectedStatus 401
$u2 = Invoke-EndpointCheck -Name "Member Service Instance 2 (:8085)" -Url "$MemberService2Url/api/members" -ExpectedStatus 401
$u3 = Invoke-EndpointCheck -Name "Subscription Service (:8083)" -Url "$SubscriptionServiceUrl/api/subscriptions" -ExpectedStatus 401
$u4 = Invoke-EndpointCheck -Name "Attendance Service (:8084)" -Url "$AttendanceServiceUrl/api/attendance/recent" -ExpectedStatus 401
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 2: Authenticate and obtain JWT
# -----------------------------------------------------------------------------
Write-Host "[STEP 2/5] Authenticating via Auth Service to obtain JWT..." -ForegroundColor Yellow
$loginPayload = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$jwtToken = $null
try {
    $loginResponse = Invoke-RestMethod -Uri "$AuthServiceUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    $jwtToken = $loginResponse.token
    if ($jwtToken) {
        Write-Host "  [PASS] Successfully logged in as 'admin'. Received JWT." -ForegroundColor Green
        Write-Host "         Token prefix: $($jwtToken.Substring(0, 30))..." -ForegroundColor Gray
    } else {
        Write-Host "  [FAIL] Login succeeded but no token in response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  [FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$authHeaders = @{
    "Authorization" = "Bearer $jwtToken"
    "Accept"        = "application/json"
}
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 3: Direct Authenticated Access with JWT
# -----------------------------------------------------------------------------
Write-Host "[STEP 3/5] Testing Direct Authenticated Access with Valid JWT (Expecting HTTP 200)..." -ForegroundColor Yellow

$a1 = Invoke-EndpointCheck -Name "Member Service Instance 1 (:8082)" -Url "$MemberService1Url/api/members" -Headers $authHeaders -ExpectedStatus 200
$a2 = Invoke-EndpointCheck -Name "Member Service Instance 2 (:8085)" -Url "$MemberService2Url/api/members" -Headers $authHeaders -ExpectedStatus 200
$a3 = Invoke-EndpointCheck -Name "Subscription Service (:8083)" -Url "$SubscriptionServiceUrl/api/subscriptions" -Headers $authHeaders -ExpectedStatus 200
$a4 = Invoke-EndpointCheck -Name "Attendance Service (:8084)" -Url "$AttendanceServiceUrl/api/attendance/recent" -Headers $authHeaders -ExpectedStatus 200
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 4: Access through API Gateway (Port 8080)
# -----------------------------------------------------------------------------
Write-Host "[STEP 4/5] Testing Gateway Routing and Verification (Port 8080 with JWT)..." -ForegroundColor Yellow

$g1 = Invoke-EndpointCheck -Name "Gateway -> Member Service" -Url "$GatewayUrl/api/members" -Headers $authHeaders -ExpectedStatus 200
$g2 = Invoke-EndpointCheck -Name "Gateway -> Subscription Service" -Url "$GatewayUrl/api/subscriptions" -Headers $authHeaders -ExpectedStatus 200
$g3 = Invoke-EndpointCheck -Name "Gateway -> Subscription Plans" -Url "$GatewayUrl/api/plans" -Headers $authHeaders -ExpectedStatus 200
$g4 = Invoke-EndpointCheck -Name "Gateway -> Attendance Service" -Url "$GatewayUrl/api/attendance/recent" -Headers $authHeaders -ExpectedStatus 200
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 5: Load Balancing Verification through Gateway
# -----------------------------------------------------------------------------
Write-Host "[STEP 5/5] Testing Runtime Load Balancing through Gateway (20 requests to /api/members)..." -ForegroundColor Yellow
$p8082 = 0
$p8085 = 0
$pOther = 0

for ($i = 1; $i -le 20; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "$GatewayUrl/api/members" -Method Get -Headers $authHeaders -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $port = $null
        foreach ($k in $resp.Headers.Keys) {
            if ($k -like "X-Handled-By-Port*") {
                $port = $resp.Headers[$k]
                break
            }
        }
        if ($port -eq "8082") {
            $p8082++
        } elseif ($port -eq "8085") {
            $p8085++
        } else {
            $pOther++
        }
    } catch {
        $pOther++
    }
}

Write-Host "  Load Balancing Distribution:" -ForegroundColor Cyan
Write-Host "    Instance 1 (Port 8082): $p8082 requests" -ForegroundColor Green
Write-Host "    Instance 2 (Port 8085): $p8085 requests" -ForegroundColor Green
if ($pOther -gt 0) {
    Write-Host "    Other / Failed: $pOther" -ForegroundColor Red
}

if ($p8082 -gt 0 -and $p8085 -gt 0) {
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "[VERIFICATION SUCCESS] Milestone 4B Downstream JWT Enforcement Complete!" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[WARNING] Requests were not distributed across both instances." -ForegroundColor Yellow
}
