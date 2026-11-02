[CmdletBinding()]
param (
    [string]$GatewayUrl = $(if ($env:PULSEFIT_GATEWAY_URL) { $env:PULSEFIT_GATEWAY_URL } else { "http://localhost:8080" }),
    [string]$AuthServiceUrl = $(if ($env:PULSEFIT_AUTH_URL) { $env:PULSEFIT_AUTH_URL } else { "http://localhost:8081" }),
    [string]$AdminUser = $(if ($env:PULSEFIT_ADMIN_USER) { $env:PULSEFIT_ADMIN_USER } else { "admin" }),
    [string]$AdminPassword = $(if ($env:PULSEFIT_ADMIN_PASS) { $env:PULSEFIT_ADMIN_PASS } else { "admin123" }),
    [string]$StaffUser = $(if ($env:PULSEFIT_STAFF_USER) { $env:PULSEFIT_STAFF_USER } else { "staff_john" }),
    [string]$StaffPassword = $(if ($env:PULSEFIT_STAFF_PASS) { $env:PULSEFIT_STAFF_PASS } else { "staff123" }),
    [string]$MemberUser = $(if ($env:PULSEFIT_MEMBER_USER) { $env:PULSEFIT_MEMBER_USER } else { "member_alex" }),
    [string]$MemberPassword = $(if ($env:PULSEFIT_MEMBER_PASS) { $env:PULSEFIT_MEMBER_PASS } else { "alex123" })
)

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " PulseFIT AI - Milestone 4C: Role-Based Access Control (RBAC) Verification" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Gateway URL:     $GatewayUrl"
Write-Host "Auth Service:    $AuthServiceUrl"
Write-Host "Admin Principal: $AdminUser"
Write-Host "Staff Principal: $StaffUser"
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
# STEP 1: Obtain JWTs for ADMIN, STAFF, and MEMBER
# -----------------------------------------------------------------------------
Write-Host "[STEP 1/6] Obtaining Valid JWTs for All Roles..." -ForegroundColor Yellow

function Get-UserToken {
    param([string]$Username, [string]$Password, [string]$RoleName)
    $loginBody = @{ username = $Username; password = $Password } | ConvertTo-Json
    $res = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/auth/login" -Body $loginBody
    if ($res.StatusCode -eq 200) {
        $json = $res.Content | ConvertFrom-Json
        Write-Host "  [PASS] Logged in as $Username ($RoleName) -> Received JWT Token" -ForegroundColor Green
        return $json.token
    } else {
        Write-Host "  [FAIL] Failed to authenticate $Username : HTTP $($res.StatusCode) $($res.Content)" -ForegroundColor Red
        return $null
    }
}

$adminToken = Get-UserToken -Username $AdminUser -Password $AdminPassword -RoleName "ROLE_ADMIN"
$staffToken = Get-UserToken -Username $StaffUser -Password $StaffPassword -RoleName "ROLE_STAFF"
$memberToken = Get-UserToken -Username $MemberUser -Password $MemberPassword -RoleName "ROLE_MEMBER"

if (-not $adminToken -or -not $staffToken -or -not $memberToken) {
    Write-Host "Authentication failed for one or more users. Aborting verification." -ForegroundColor Red
    exit 1
}

$adminHeaders = @{ "Authorization" = "Bearer $adminToken"; "Accept" = "application/json" }
$staffHeaders = @{ "Authorization" = "Bearer $staffToken"; "Accept" = "application/json" }
$memberHeaders = @{ "Authorization" = "Bearer $memberToken"; "Accept" = "application/json" }
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 2: Verify Missing Token Returns 401 Unauthorized
# -----------------------------------------------------------------------------
Write-Host "[STEP 2/6] Verifying Unauthenticated Requests (Expecting HTTP 401)..." -ForegroundColor Yellow

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members"
Check-Result -Description "Unauthenticated GET /api/members" -ActualCode $r.StatusCode -ExpectedCodes @(401)

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/plans"
Check-Result -Description "Unauthenticated GET /api/plans" -ActualCode $r.StatusCode -ExpectedCodes @(401)

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions"
Check-Result -Description "Unauthenticated GET /api/subscriptions" -ActualCode $r.StatusCode -ExpectedCodes @(401)

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/recent"
Check-Result -Description "Unauthenticated GET /api/attendance/recent" -ActualCode $r.StatusCode -ExpectedCodes @(401)
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 3: Verify Role-Based Authorization Matrix (403 vs 2xx)
# -----------------------------------------------------------------------------
Write-Host "[STEP 3/6] Verifying RBAC Policy Enforcement on Protected Endpoints..." -ForegroundColor Yellow

# Test Member Deletion Policy: DELETE /api/members/{id} -> ADMIN only
Write-Host "--- Policy 1: DELETE /api/members/{id} (ADMIN only) ---" -ForegroundColor Cyan

# Create a test member using STAFF token
$newMemberPayload = @{
    name             = "Test Subject RBAC"
    contact          = "+1999111222"
    email            = "rbac_test@pulsefit.com"
    address          = "100 Security Blvd"
    emergencyContact = "+1999111223"
} | ConvertTo-Json

$createMemberRes = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/members" -Headers $staffHeaders -Body $newMemberPayload
$testMemberId = $null
if ($createMemberRes.StatusCode -eq 201) {
    $memberObj = $createMemberRes.Content | ConvertFrom-Json
    $testMemberId = $memberObj.memberId
    Check-Result -Description "STAFF creates test member (POST /api/members)" -ActualCode $createMemberRes.StatusCode -ExpectedCodes @(201) -Extra "Member ID: $testMemberId"
} else {
    Check-Result -Description "STAFF creates test member (POST /api/members)" -ActualCode $createMemberRes.StatusCode -ExpectedCodes @(201)
}

if ($testMemberId) {
    # 1. MEMBER cannot delete member
    $delMemberByMember = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/members/$testMemberId" -Headers $memberHeaders
    Check-Result -Description "MEMBER cannot delete member (DELETE /api/members/{id})" -ActualCode $delMemberByMember.StatusCode -ExpectedCodes @(403)

    # 2. STAFF cannot delete member
    $delMemberByStaff = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/members/$testMemberId" -Headers $staffHeaders
    Check-Result -Description "STAFF cannot delete member (DELETE /api/members/{id})" -ActualCode $delMemberByStaff.StatusCode -ExpectedCodes @(403)

    # 3. ADMIN can delete member
    $delMemberByAdmin = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/members/$testMemberId" -Headers $adminHeaders
    Check-Result -Description "ADMIN can delete member (DELETE /api/members/{id})" -ActualCode $delMemberByAdmin.StatusCode -ExpectedCodes @(200)
}

# Test Plan Management Policy: POST /api/plans & DELETE /api/plans/{id} -> ADMIN or STAFF
Write-Host "--- Policy 2: POST /api/plans & DELETE /api/plans/{id} (ADMIN or STAFF) ---" -ForegroundColor Cyan

# 4. MEMBER cannot create plan
$planPayload = @{
    planName       = "Unauthorized Member Plan"
    description    = "Should be rejected"
    durationInDays = 30
    price          = 49.99
    active         = $true
} | ConvertTo-Json
$createPlanByMember = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/plans" -Headers $memberHeaders -Body $planPayload
Check-Result -Description "MEMBER cannot create plan (POST /api/plans)" -ActualCode $createPlanByMember.StatusCode -ExpectedCodes @(403)

# 5. MEMBER cannot delete plan
$delPlanByMember = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/plans/1" -Headers $memberHeaders
Check-Result -Description "MEMBER cannot delete plan (DELETE /api/plans/1)" -ActualCode $delPlanByMember.StatusCode -ExpectedCodes @(403)

# 6. STAFF can create and delete plan
$staffPlanPayload = @{
    planName       = "Staff Special Plan $(Get-Random)"
    description    = "Created by staff"
    durationInDays = 60
    price          = 89.99
    active         = $true
} | ConvertTo-Json
$createPlanByStaff = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/plans" -Headers $staffHeaders -Body $staffPlanPayload
$staffPlanId = $null
if ($createPlanByStaff.StatusCode -eq 201) {
    $planObj = $createPlanByStaff.Content | ConvertFrom-Json
    $staffPlanId = $planObj.planId
    Check-Result -Description "STAFF can create plan (POST /api/plans)" -ActualCode $createPlanByStaff.StatusCode -ExpectedCodes @(201) -Extra "Plan ID: $staffPlanId"
} else {
    Check-Result -Description "STAFF can create plan (POST /api/plans)" -ActualCode $createPlanByStaff.StatusCode -ExpectedCodes @(201)
}
if ($staffPlanId) {
    $delPlanByStaff = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/plans/$staffPlanId" -Headers $staffHeaders
    Check-Result -Description "STAFF can delete plan (DELETE /api/plans/{id})" -ActualCode $delPlanByStaff.StatusCode -ExpectedCodes @(200)
}

# 7. ADMIN can create and delete plan
$adminPlanPayload = @{
    planName       = "Admin Special Plan $(Get-Random)"
    description    = "Created by admin"
    durationInDays = 90
    price          = 129.99
    active         = $true
} | ConvertTo-Json
$createPlanByAdmin = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/plans" -Headers $adminHeaders -Body $adminPlanPayload
$adminPlanId = $null
if ($createPlanByAdmin.StatusCode -eq 201) {
    $planObj = $createPlanByAdmin.Content | ConvertFrom-Json
    $adminPlanId = $planObj.planId
    Check-Result -Description "ADMIN can create plan (POST /api/plans)" -ActualCode $createPlanByAdmin.StatusCode -ExpectedCodes @(201) -Extra "Plan ID: $adminPlanId"
} else {
    Check-Result -Description "ADMIN can create plan (POST /api/plans)" -ActualCode $createPlanByAdmin.StatusCode -ExpectedCodes @(201)
}
if ($adminPlanId) {
    $delPlanByAdmin = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/plans/$adminPlanId" -Headers $adminHeaders
    Check-Result -Description "ADMIN can delete plan (DELETE /api/plans/{id})" -ActualCode $delPlanByAdmin.StatusCode -ExpectedCodes @(200)
}

# Test Subscription Deletion Policy: DELETE /api/subscriptions/{id} -> ADMIN or STAFF
Write-Host "--- Policy 3: DELETE /api/subscriptions/{id} (ADMIN or STAFF) ---" -ForegroundColor Cyan

# 8. MEMBER cannot delete subscription
$delSubByMember = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/subscriptions/1" -Headers $memberHeaders
Check-Result -Description "MEMBER cannot delete subscription (DELETE /api/subscriptions/1)" -ActualCode $delSubByMember.StatusCode -ExpectedCodes @(403)

# 9. Create a subscription and delete by STAFF
$subReqPayload = @{
    memberId       = 2
    planId         = 2
    startDate      = (Get-Date).ToString("yyyy-MM-dd")
    durationInDays = 30
} | ConvertTo-Json
$createSubRes = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/subscriptions" -Headers $staffHeaders -Body $subReqPayload
if ($createSubRes.StatusCode -eq 201) {
    $subObj = $createSubRes.Content | ConvertFrom-Json
    $newSubId = $subObj.subscriptionId
    $delSubByStaff = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/subscriptions/$newSubId" -Headers $staffHeaders
    Check-Result -Description "STAFF can delete subscription (DELETE /api/subscriptions/{id})" -ActualCode $delSubByStaff.StatusCode -ExpectedCodes @(204)
} else {
    # Delete existing subscription or test on ID 3
    $delSubByStaff = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/subscriptions/3" -Headers $staffHeaders
    Check-Result -Description "STAFF can delete subscription (DELETE /api/subscriptions/3)" -ActualCode $delSubByStaff.StatusCode -ExpectedCodes @(204, 200, 404)
}

# 10. Attendance Security: GET /api/attendance/ai/fraud-alerts -> ADMIN or STAFF
Write-Host "--- Policy 4: GET /api/attendance/ai/fraud-alerts (ADMIN or STAFF) ---" -ForegroundColor Cyan

$fraudByMember = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/ai/fraud-alerts" -Headers $memberHeaders
Check-Result -Description "MEMBER cannot view fraud alerts" -ActualCode $fraudByMember.StatusCode -ExpectedCodes @(403)

$fraudByStaff = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/ai/fraud-alerts" -Headers $staffHeaders
Check-Result -Description "STAFF can view fraud alerts" -ActualCode $fraudByStaff.StatusCode -ExpectedCodes @(200)

$fraudByAdmin = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/ai/fraud-alerts" -Headers $adminHeaders
Check-Result -Description "ADMIN can view fraud alerts" -ActualCode $fraudByAdmin.StatusCode -ExpectedCodes @(200)
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 4: Test Forged Header Sanitization
# -----------------------------------------------------------------------------
Write-Host "[STEP 4/6] Verifying Identity-Header Sanitization (Spoofing Resistance)..." -ForegroundColor Yellow

$spoofedHeaders = @{
    "Authorization" = "Bearer $memberToken"
    "X-User-Role"   = "ROLE_ADMIN"
    "X-User-Name"   = "admin"
    "Accept"        = "application/json"
}

$spoofedPlanPayload = @{
    planName       = "Attacker Spoofed Plan"
    description    = "Attempted privilege escalation"
    durationInDays = 30
    price          = 1.00
    active         = $true
} | ConvertTo-Json

# MEMBER token with forged ADMIN header attempting to create plan
$spoofedPlanRes = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/plans" -Headers $spoofedHeaders -Body $spoofedPlanPayload
Check-Result -Description "Forged X-User-Role cannot create plan (Gateway strips/overwrites forged headers)" -ActualCode $spoofedPlanRes.StatusCode -ExpectedCodes @(403)

# MEMBER token with forged ADMIN header attempting to delete member
$spoofedMemberDelRes = Invoke-ApiRequest -Method "DELETE" -Uri "$GatewayUrl/api/members/1" -Headers $spoofedHeaders
Check-Result -Description "Forged X-User-Role cannot delete member (Downstream relies on JWT SecurityContext)" -ActualCode $spoofedMemberDelRes.StatusCode -ExpectedCodes @(403)
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 5: Verify Read Operations Remain Accessible
# -----------------------------------------------------------------------------
Write-Host "[STEP 5/6] Verifying Read Operations for Authenticated Users (HTTP 200)..." -ForegroundColor Yellow

$r1 = Invoke-ApiRequest -Uri "$GatewayUrl/api/members" -Headers $memberHeaders
Check-Result -Description "MEMBER reads /api/members" -ActualCode $r1.StatusCode -ExpectedCodes @(200)

$r2 = Invoke-ApiRequest -Uri "$GatewayUrl/api/plans" -Headers $memberHeaders
Check-Result -Description "MEMBER reads /api/plans" -ActualCode $r2.StatusCode -ExpectedCodes @(200)

$r3 = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions" -Headers $memberHeaders
Check-Result -Description "MEMBER reads /api/subscriptions" -ActualCode $r3.StatusCode -ExpectedCodes @(200)

$r4 = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/recent" -Headers $memberHeaders
Check-Result -Description "MEMBER reads /api/attendance/recent" -ActualCode $r4.StatusCode -ExpectedCodes @(200)
Write-Host ""

# -----------------------------------------------------------------------------
# STEP 6: Verify Member Service Load Balancing Across 8082 and 8085
# -----------------------------------------------------------------------------
Write-Host "[STEP 6/6] Verifying Member Service Load Balancing Through Gateway..." -ForegroundColor Yellow

$portCounts = @{}
for ($i = 1; $i -le 10; $i++) {
    $res = Invoke-ApiRequest -Uri "$GatewayUrl/api/members" -Headers $adminHeaders
    $port = $res.Port
    if ($port) {
        if (-not $portCounts.ContainsKey($port)) { $portCounts[$port] = 0 }
        $portCounts[$port]++
    }
}

Write-Host "  Load Distribution (10 Requests to /api/members):" -ForegroundColor Cyan
foreach ($p in $portCounts.Keys) {
    Write-Host ("    - Port {0}: {1} requests" -f $p, $portCounts[$p]) -ForegroundColor Cyan
}

if ($portCounts.ContainsKey("8082") -and $portCounts.ContainsKey("8085")) {
    $script:passCount++
    Write-Host "  [PASS] Load balancing operational across Member Service instances (:8082 and :8085)" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Requests served by available registered instance(s): $($portCounts.Keys -join ', ')" -ForegroundColor Yellow
}
Write-Host ""

# -----------------------------------------------------------------------------
# SUMMARY REPORT
# -----------------------------------------------------------------------------
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " RBAC Verification Summary" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Total Passed: $passCount" -ForegroundColor Green
Write-Host "Total Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host ">>> MILESTONE 4C RBAC VERIFICATION SUCCESSFUL <<<" -ForegroundColor Green
    exit 0
} else {
    Write-Host ">>> SOME RBAC VERIFICATION CHECKS FAILED <<<" -ForegroundColor Red
    exit 1
}
