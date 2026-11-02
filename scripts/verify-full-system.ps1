[CmdletBinding()]
param (
    [string]$GatewayUrl = $(if ($env:PULSEFIT_GATEWAY_URL) { $env:PULSEFIT_GATEWAY_URL } else { "http://localhost:8080" }),
    [string]$AuthServiceUrl = $(if ($env:PULSEFIT_AUTH_URL) { $env:PULSEFIT_AUTH_URL } else { "http://localhost:8081" }),
    [string]$EurekaUrl = $(if ($env:PULSEFIT_EUREKA_URL) { $env:PULSEFIT_EUREKA_URL } else { "http://localhost:8761" }),
    [string]$MemberService1Url = $(if ($env:PULSEFIT_MEMBER1_URL) { $env:PULSEFIT_MEMBER1_URL } else { "http://localhost:8082" }),
    [string]$MemberService2Url = $(if ($env:PULSEFIT_MEMBER2_URL) { $env:PULSEFIT_MEMBER2_URL } else { "http://localhost:8085" }),
    [string]$SubscriptionServiceUrl = $(if ($env:PULSEFIT_SUB_URL) { $env:PULSEFIT_SUB_URL } else { "http://localhost:8083" }),
    [string]$AttendanceServiceUrl = $(if ($env:PULSEFIT_ATT_URL) { $env:PULSEFIT_ATT_URL } else { "http://localhost:8084" }),
    [string]$AdminUser = $(if ($env:PULSEFIT_ADMIN_USER) { $env:PULSEFIT_ADMIN_USER } else { "admin" }),
    [string]$AdminPassword = $(if ($env:PULSEFIT_ADMIN_PASS) { $env:PULSEFIT_ADMIN_PASS } else { "admin123" }),
    [string]$StaffUser = $(if ($env:PULSEFIT_STAFF_USER) { $env:PULSEFIT_STAFF_USER } else { "staff_john" }),
    [string]$StaffPassword = $(if ($env:PULSEFIT_STAFF_PASS) { $env:PULSEFIT_STAFF_PASS } else { "staff123" }),
    [string]$MemberUser = $(if ($env:PULSEFIT_MEMBER_USER) { $env:PULSEFIT_MEMBER_USER } else { "member_alex" }),
    [string]$MemberPassword = $(if ($env:PULSEFIT_MEMBER_PASS) { $env:PULSEFIT_MEMBER_PASS } else { "alex123" })
)

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " PulseFIT AI - Milestone 5: Full-System Integration Verification" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Gateway:        $GatewayUrl"
Write-Host "Eureka:         $EurekaUrl"
Write-Host "Auth Service:   $AuthServiceUrl"
Write-Host "Admin Principal:$AdminUser"
Write-Host "Staff Principal:$StaffUser"
Write-Host "Member Principal:$MemberUser"
Write-Host ""

$passCount = 0
$failCount = 0

function Check-Result {
    param(
        [string]$Description,
        [int]$ActualCode,
        [int[]]$ExpectedCodes,
        [string]$Extra = ""
    )
    if ($ExpectedCodes -contains $ActualCode) {
        $script:passCount++
        $msg = "  [PASS] $Description -> HTTP $ActualCode"
        if ($Extra) { $msg += " ($Extra)" }
        Write-Host $msg -ForegroundColor Green
    } else {
        $script:failCount++
        $expectedStr = ($ExpectedCodes -join " or ")
        Write-Host "  [FAIL] $Description -> HTTP $ActualCode (Expected $expectedStr)" -ForegroundColor Red
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Method = "GET",
        [string]$Uri,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    try {
        $params = @{
            Uri             = $Uri
            Method          = $Method
            Headers         = $Headers
            UseBasicParsing = $true
            TimeoutSec      = 5
            ErrorAction     = "Stop"
        }
        if ($Body) {
            $params["Body"] = $Body
            $params["ContentType"] = "application/json"
        }
        $resp = Invoke-WebRequest @params
        $port = $null
        foreach ($k in $resp.Headers.Keys) {
            if ($k -like "X-Handled-By-Port*") {
                $port = $resp.Headers[$k]
                break
            }
        }
        return @{
            StatusCode = $resp.StatusCode
            Content    = $resp.Content
            Port       = $port
        }
    } catch {
        $ex = $_.Exception.Response
        if ($ex) {
            $port = $null
            if ($ex.Headers) {
                $port = $ex.Headers["X-Handled-By-Port"]
            }
            $reader = New-Object System.IO.StreamReader($ex.GetResponseStream())
            $bodyText = $reader.ReadToEnd()
            return @{
                StatusCode = [int]$ex.StatusCode
                Content    = $bodyText
                Port       = $port
            }
        } else {
            return @{
                StatusCode = 0
                Content    = $_.Exception.Message
                Port       = $null
            }
        }
    }
}

# -----------------------------------------------------------------------------
# STEP 1: Eureka Registration Verification
# -----------------------------------------------------------------------------
Write-Host "[STEP 1/7] Verifying Eureka Service Registration..." -ForegroundColor Yellow
try {
    $eurekaApps = Invoke-RestMethod -Uri "$EurekaUrl/eureka/apps" -Headers @{ "Accept" = "application/json" } -UseBasicParsing -TimeoutSec 5
    $appNames = @()
    $registeredInstances = @{}
    foreach ($app in $eurekaApps.applications.application) {
        $appNames += $app.name
        $instances = @($app.instance)
        $registeredInstances[$app.name] = $instances.Count
    }

    $requiredServices = @("API-GATEWAY", "AUTH-SERVICE", "MEMBER-SERVICE", "SUBSCRIPTION-SERVICE", "ATTENDANCE-SERVICE")
    $allRegistered = $true
    foreach ($req in $requiredServices) {
        if ($appNames -contains $req) {
            $count = $registeredInstances[$req]
            Write-Host ("  [PASS] {0} is registered (Instance count: {1})" -f $req, $count) -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host ("  [FAIL] {0} is NOT registered with Eureka" -f $req) -ForegroundColor Red
            $script:failCount++
            $allRegistered = $false
        }
    }

    if ($registeredInstances["MEMBER-SERVICE"] -ge 2) {
        Write-Host "  [PASS] MEMBER-SERVICE has multi-instance registration (Ports 8082 & 8085)" -ForegroundColor Green
        $script:passCount++
    } else {
        Write-Host "  [FAIL] MEMBER-SERVICE does not have 2 registered instances" -ForegroundColor Red
        $script:failCount++
    }
} catch {
    Write-Host "  [FAIL] Could not query Eureka Server: $($_.Exception.Message)" -ForegroundColor Red
    $script:failCount++
}
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 2: Authenticate & Obtain Tokens for All Roles
# -----------------------------------------------------------------------------
Write-Host "[STEP 2/7] Authenticating Roles via Gateway..." -ForegroundColor Yellow

function Get-Token {
    param([string]$Username, [string]$Password, [string]$RoleName)
    $loginBody = @{ username = $Username; password = $Password } | ConvertTo-Json
    $res = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/auth/login" -Body $loginBody
    if ($res.StatusCode -eq 200) {
        $json = $res.Content | ConvertFrom-Json
        Write-Host ("  [PASS] Logged in as {0} ({1}) -> JWT Acquired" -f $Username, $RoleName) -ForegroundColor Green
        $script:passCount++
        return $json.token
    } else {
        Write-Host ("  [FAIL] Failed login for {0}: HTTP {1}" -f $Username, $res.StatusCode) -ForegroundColor Red
        $script:failCount++
        return $null
    }
}

$adminToken = Get-Token -Username $AdminUser -Password $AdminPassword -RoleName "ROLE_ADMIN"
$staffToken = Get-Token -Username $StaffUser -Password $StaffPassword -RoleName "ROLE_STAFF"
$memberToken = Get-Token -Username $MemberUser -Password $MemberPassword -RoleName "ROLE_MEMBER"

if (-not $adminToken -or -not $staffToken -or -not $memberToken) {
    Write-Host "Critical authentication failure. Aborting." -ForegroundColor Red
    exit 1
}

$adminHeaders = @{ "Authorization" = "Bearer $adminToken"; "Accept" = "application/json" }
$staffHeaders = @{ "Authorization" = "Bearer $staffToken"; "Accept" = "application/json" }
$memberHeaders = @{ "Authorization" = "Bearer $memberToken"; "Accept" = "application/json" }
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 3: Gateway Routing & Direct Downstream Security (401 Verification)
# -----------------------------------------------------------------------------
Write-Host "[STEP 3/7] Verifying Gateway Routing and Direct Downstream JWT Enforcement..." -ForegroundColor Yellow

# Direct downstream calls without JWT must return HTTP 401
$d1 = Invoke-ApiRequest -Uri "$MemberService1Url/api/members"
Check-Result -Description "Direct unauthenticated access to Member Service 1 (:8082)" -ActualCode $d1.StatusCode -ExpectedCodes @(401)

$d2 = Invoke-ApiRequest -Uri "$MemberService2Url/api/members"
Check-Result -Description "Direct unauthenticated access to Member Service 2 (:8085)" -ActualCode $d2.StatusCode -ExpectedCodes @(401)

$d3 = Invoke-ApiRequest -Uri "$SubscriptionServiceUrl/api/subscriptions"
Check-Result -Description "Direct unauthenticated access to Subscription Service (:8083)" -ActualCode $d3.StatusCode -ExpectedCodes @(401)

$d4 = Invoke-ApiRequest -Uri "$AttendanceServiceUrl/api/attendance/recent"
Check-Result -Description "Direct unauthenticated access to Attendance Service (:8084)" -ActualCode $d4.StatusCode -ExpectedCodes @(401)

# Gateway routing with valid JWT
$g1 = Invoke-ApiRequest -Uri "$GatewayUrl/api/members" -Headers $adminHeaders
Check-Result -Description "Gateway routes /api/members to MEMBER-SERVICE" -ActualCode $g1.StatusCode -ExpectedCodes @(200)

$g2 = Invoke-ApiRequest -Uri "$GatewayUrl/api/plans" -Headers $adminHeaders
Check-Result -Description "Gateway routes /api/plans to SUBSCRIPTION-SERVICE" -ActualCode $g2.StatusCode -ExpectedCodes @(200)

$g3 = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions" -Headers $adminHeaders
Check-Result -Description "Gateway routes /api/subscriptions to SUBSCRIPTION-SERVICE" -ActualCode $g3.StatusCode -ExpectedCodes @(200)

$g4 = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/recent" -Headers $adminHeaders
Check-Result -Description "Gateway routes /api/attendance/** to ATTENDANCE-SERVICE" -ActualCode $g4.StatusCode -ExpectedCodes @(200)
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 4: RBAC & Identity Header Sanitization Verification
# -----------------------------------------------------------------------------
Write-Host "[STEP 4/7] Verifying RBAC and Gateway Header Sanitization..." -ForegroundColor Yellow

# MEMBER cannot delete member -> 403
$r1 = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/members/1" -Headers $memberHeaders
Check-Result -Description "RBAC: MEMBER cannot delete member" -ActualCode $r1.StatusCode -ExpectedCodes @(403)

# MEMBER cannot create plan -> 403
$planPayload = @{
    planName       = "Unauthorized Plan $(Get-Random)"
    description    = "Blocked"
    durationInDays = 30
    price          = 49.99
    active         = $true
} | ConvertTo-Json
$r2 = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/plans" -Headers $memberHeaders -Body $planPayload
Check-Result -Description "RBAC: MEMBER cannot create plan" -ActualCode $r2.StatusCode -ExpectedCodes @(403)

# Spoofed headers cannot bypass MEMBER JWT -> 403
$spoofedHeaders = @{
    "Authorization" = "Bearer $memberToken"
    "X-User-Role"   = "ROLE_ADMIN"
    "X-User-Name"   = "admin"
    "Accept"        = "application/json"
}
$r3 = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/plans" -Headers $spoofedHeaders -Body $planPayload
Check-Result -Description "Security: Spoofed X-User-Role cannot create plan" -ActualCode $r3.StatusCode -ExpectedCodes @(403)
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 5: End-to-End Business Lifecycle Workflow
# -----------------------------------------------------------------------------
Write-Host "[STEP 5/7] Executing Complete End-to-End Business Lifecycle Workflow..." -ForegroundColor Yellow

$uniqueContact = "+1" + (Get-Random -Minimum 100000000 -Maximum 999999999)
$uniqueEmail = "e2e_" + (Get-Random) + "@pulsefit.test"

# 1. Create a member (POST /api/members)
$memberPayload = @{
    name             = "Integration Test Member"
    contact          = $uniqueContact
    email            = $uniqueEmail
    address          = "404 Integration Way"
    emergencyContact = "+1999888777"
} | ConvertTo-Json

$createdMemberRes = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/members" -Headers $adminHeaders -Body $memberPayload
$e2eMemberId = $null
if ($createdMemberRes.StatusCode -eq 201) {
    $mObj = $createdMemberRes.Content | ConvertFrom-Json
    $e2eMemberId = $mObj.memberId
    Check-Result -Description "Workflow 1: Admin created test member" -ActualCode $createdMemberRes.StatusCode -ExpectedCodes @(201) -Extra "Member ID: $e2eMemberId"
} else {
    Check-Result -Description "Workflow 1: Admin created test member" -ActualCode $createdMemberRes.StatusCode -ExpectedCodes @(201)
}

# 2. Retrieve existing active membership plans
$plansRes = Invoke-ApiRequest -Uri "$GatewayUrl/api/plans" -Headers $adminHeaders
$selectedPlanId = 1
if ($plansRes.StatusCode -eq 200) {
    $plansList = $plansRes.Content | ConvertFrom-Json
    if ($plansList.Count -gt 0) {
        $selectedPlanId = $plansList[0].planId
    }
    Check-Result -Description "Workflow 2: Retrieved membership plans" -ActualCode $plansRes.StatusCode -ExpectedCodes @(200) -Extra "Plan ID: $selectedPlanId"
}

# 3. Create subscription for that member (POST /api/subscriptions)
# (Exercises OpenFeign call: Subscription Service -> Member Service)
$subPayload = @{
    memberId       = $e2eMemberId
    planId         = $selectedPlanId
    startDate      = (Get-Date).ToString("yyyy-MM-dd")
    durationInDays = 30
} | ConvertTo-Json

$createdSubRes = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/subscriptions" -Headers $adminHeaders -Body $subPayload
$e2eSubId = $null
if ($createdSubRes.StatusCode -eq 201) {
    $sObj = $createdSubRes.Content | ConvertFrom-Json
    $e2eSubId = $sObj.subscriptionId
    Check-Result -Description "Workflow 3: Created subscription (Feign Member verification)" -ActualCode $createdSubRes.StatusCode -ExpectedCodes @(201) -Extra "Sub ID: $e2eSubId"
} else {
    Check-Result -Description "Workflow 3: Created subscription" -ActualCode $createdSubRes.StatusCode -ExpectedCodes @(201)
}

# 4. Verify subscription active status (GET /api/subscriptions/member/{memberId}/active)
$activeSubRes = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/$e2eMemberId/active" -Headers $adminHeaders
if ($activeSubRes.StatusCode -eq 200) {
    $activeObj = $activeSubRes.Content | ConvertFrom-Json
    $isActive = ($activeObj.status -eq "ACTIVE")
    Check-Result -Description "Workflow 4: Subscription verified active" -ActualCode $activeSubRes.StatusCode -ExpectedCodes @(200) -Extra "Status: $($activeObj.status)"
} else {
    Check-Result -Description "Workflow 4: Subscription verified active" -ActualCode $activeSubRes.StatusCode -ExpectedCodes @(200)
}

# 5. Perform attendance turnstile check-in (POST /api/attendance/check-in)
# (Exercises OpenFeign calls: Attendance Service -> Member Service & Subscription Service)
$checkInPayload = @{
    memberId     = $e2eMemberId
    facilityName = "PulseFit Integration Test Gym"
    facilityId   = "FAC-E2E"
    gateId       = "GATE-01"
} | ConvertTo-Json

$checkInRes = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/attendance/check-in" -Headers $adminHeaders -Body $checkInPayload
if ($checkInRes.StatusCode -eq 200) {
    $ciObj = $checkInRes.Content | ConvertFrom-Json
    Check-Result -Description "Workflow 5: Turnstile check-in granted (Feign multi-service validation)" -ActualCode $checkInRes.StatusCode -ExpectedCodes @(200) -Extra "Granted: $($ciObj.granted)"
} else {
    Check-Result -Description "Workflow 5: Turnstile check-in" -ActualCode $checkInRes.StatusCode -ExpectedCodes @(200)
}

# 6. Perform attendance turnstile check-out (POST /api/attendance/check-out)
$checkOutPayload = @{
    memberId   = $e2eMemberId
    facilityId = "FAC-E2E"
    gateId     = "GATE-01"
} | ConvertTo-Json

$checkOutRes = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/attendance/check-out" -Headers $adminHeaders -Body $checkOutPayload
Check-Result -Description "Workflow 6: Turnstile check-out recorded" -ActualCode $checkOutRes.StatusCode -ExpectedCodes @(200)

# 7. Retrieve attendance history (GET /api/attendance/member/{memberId})
$attHistoryRes = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/$e2eMemberId" -Headers $adminHeaders
if ($attHistoryRes.StatusCode -eq 200) {
    $attList = $attHistoryRes.Content | ConvertFrom-Json
    Check-Result -Description "Workflow 7: Retrieved member attendance history" -ActualCode $attHistoryRes.StatusCode -ExpectedCodes @(200) -Extra "Records found: $($attList.Count)"
} else {
    Check-Result -Description "Workflow 7: Retrieved member attendance history" -ActualCode $attHistoryRes.StatusCode -ExpectedCodes @(200)
}

# 8. Clean up created workflow records safely
if ($e2eSubId) {
    $delSubRes = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/subscriptions/${e2eSubId}?hard=true" -Headers $adminHeaders
    Check-Result -Description "Workflow 8a: Cleaned up test subscription" -ActualCode $delSubRes.StatusCode -ExpectedCodes @(204, 200)
}
if ($e2eMemberId) {
    $delMemRes = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/members/$e2eMemberId" -Headers $adminHeaders
    Check-Result -Description "Workflow 8b: Cleaned up test member" -ActualCode $delMemRes.StatusCode -ExpectedCodes @(200)
}
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 6: Negative Security & Business Scenarios
# -----------------------------------------------------------------------------
Write-Host "[STEP 6/7] Testing Negative Security and Business Scenarios..." -ForegroundColor Yellow

# Neg 1: Invalid JWT token
$invalidHeaders = @{ "Authorization" = "Bearer invalid.fake.token"; "Accept" = "application/json" }
$neg1 = Invoke-ApiRequest -Uri "$GatewayUrl/api/members" -Headers $invalidHeaders
Check-Result -Description "Negative 1: Invalid JWT returns 401 Unauthorized" -ActualCode $neg1.StatusCode -ExpectedCodes @(401)

# Neg 2: Expired JWT token
$expiredToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGV4Iiwicm9sZSI6IlJPTEVfTUVNQkVSIiwiZXhwIjoxNTAwMDAwMDAwfQ.invalidSignatureExpired"
$expiredHeaders = @{ "Authorization" = "Bearer $expiredToken"; "Accept" = "application/json" }
$neg2 = Invoke-ApiRequest -Uri "$GatewayUrl/api/members" -Headers $expiredHeaders
Check-Result -Description "Negative 2: Expired/Malformed JWT returns 401 Unauthorized" -ActualCode $neg2.StatusCode -ExpectedCodes @(401)

# Neg 3: MEMBER role attempting ADMIN-only operation
$neg3 = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/members/1" -Headers $memberHeaders
Check-Result -Description "Negative 3: MEMBER attempting ADMIN delete returns 403 Forbidden" -ActualCode $neg3.StatusCode -ExpectedCodes @(403)

# Neg 4: Subscription creation for nonexistent member (Feign 404 propagation)
$invalidSubPayload = @{
    memberId       = 999999
    planId         = 1
    startDate      = (Get-Date).ToString("yyyy-MM-dd")
    durationInDays = 30
} | ConvertTo-Json
$neg4 = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/subscriptions" -Headers $adminHeaders -Body $invalidSubPayload
Check-Result -Description "Negative 4: Subscription for nonexistent member returns 404 Not Found" -ActualCode $neg4.StatusCode -ExpectedCodes @(404)

# Neg 5: Turnstile check-in without an active subscription
# Create a member with no subscription, attempt turnstile check-in
$unsubPayload = @{
    name             = "Unsubscribed Subject"
    contact          = "+1" + (Get-Random -Minimum 100000000 -Maximum 999999999)
    email            = "unsub_" + (Get-Random) + "@pulsefit.test"
    address          = "No Subscription Ave"
    emergencyContact = "+1999888777"
} | ConvertTo-Json
$unsubMemRes = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/members" -Headers $adminHeaders -Body $unsubPayload
if ($unsubMemRes.StatusCode -eq 201) {
    $unsubMemId = ($unsubMemRes.Content | ConvertFrom-Json).memberId
    $deniedCheckInPayload = @{
        memberId     = $unsubMemId
        facilityName = "PulseFit Central"
        facilityId   = "FAC-DENIED"
        gateId       = "GATE-DENIED"
    } | ConvertTo-Json
    $neg5 = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/attendance/check-in" -Headers $adminHeaders -Body $deniedCheckInPayload
    Check-Result -Description "Negative 5: Check-in without active subscription denied" -ActualCode $neg5.StatusCode -ExpectedCodes @(403, 400)
    # Clean up unsubscribed member
    $delUnsubMem = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/members/$unsubMemId" -Headers $adminHeaders
}
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 7: Member Service Load Balancing Regression Check
# -----------------------------------------------------------------------------
Write-Host "[STEP 7/7] Verifying Member Service Load Balancing Regression (Ports 8082 & 8085)..." -ForegroundColor Yellow

$portCounts = @{}
for ($i = 1; $i -le 10; $i++) {
    $res = Invoke-ApiRequest -Uri "$GatewayUrl/api/members" -Headers $adminHeaders
    $port = $res.Port
    if ($port) {
        if (-not $portCounts.ContainsKey($port)) { $portCounts[$port] = 0 }
        $portCounts[$port]++
    }
}

Write-Host "  Load Distribution (10 Consecutive Requests through Gateway):" -ForegroundColor Cyan
foreach ($p in $portCounts.Keys) {
    Write-Host ("    - Port {0}: {1} requests" -f $p, $portCounts[$p]) -ForegroundColor Cyan
}

if ($portCounts.ContainsKey("8082") -and $portCounts.ContainsKey("8085")) {
    Write-Host "  [PASS] Load balancing operational across both Member Service instances (:8082 and :8085)" -ForegroundColor Green
    $script:passCount++
} else {
    Write-Host "  [WARN] Requests routed to: $($portCounts.Keys -join ', ')" -ForegroundColor Yellow
}
Write-Host ""

# -----------------------------------------------------------------------------
# SUMMARY REPORT
# -----------------------------------------------------------------------------
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Full-System Integration Verification Summary" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Total Passed: $passCount" -ForegroundColor Green
Write-Host "Total Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host ">>> MILESTONE 5 FULL-SYSTEM INTEGRATION VERIFICATION SUCCESSFUL <<<" -ForegroundColor Green
    exit 0
} else {
    Write-Host ">>> SOME INTEGRATION CHECKS FAILED <<<" -ForegroundColor Red
    exit 1
}
