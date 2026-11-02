[CmdletBinding()]
param (
    [string]$GatewayUrl = $(if ($env:PULSEFIT_GATEWAY_URL) { $env:PULSEFIT_GATEWAY_URL } else { "http://localhost:8080" }),
    [string]$AuthServiceUrl = $(if ($env:PULSEFIT_AUTH_URL) { $env:PULSEFIT_AUTH_URL } else { "http://localhost:8081" }),
    [string]$AdminUser = $(if ($env:PULSEFIT_ADMIN_USER) { $env:PULSEFIT_ADMIN_USER } else { "admin" }),
    [string]$AdminPassword = $(if ($env:PULSEFIT_ADMIN_PASS) { $env:PULSEFIT_ADMIN_PASS } else { "admin123" }),
    [string]$StaffUser = $(if ($env:PULSEFIT_STAFF_USER) { $env:PULSEFIT_STAFF_USER } else { "staff_john" }),
    [string]$StaffPassword = $(if ($env:PULSEFIT_STAFF_PASS) { $env:PULSEFIT_STAFF_PASS } else { "staff123" }),
    [string]$Member1User = $(if ($env:PULSEFIT_MEMBER1_USER) { $env:PULSEFIT_MEMBER1_USER } else { "member_alex" }),
    [string]$Member1Password = $(if ($env:PULSEFIT_MEMBER1_PASS) { $env:PULSEFIT_MEMBER1_PASS } else { "alex123" }),
    [string]$Member2User = $(if ($env:PULSEFIT_MEMBER2_USER) { $env:PULSEFIT_MEMBER2_USER } else { "member_sarah" }),
    [string]$Member2Password = $(if ($env:PULSEFIT_MEMBER2_PASS) { $env:PULSEFIT_MEMBER2_PASS } else { "sarah123" })
)

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " PulseFIT AI - Milestone 5A: Object-Level Authorization (BOLA/IDOR) Verification" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Gateway URL:         $GatewayUrl"
Write-Host "Auth Service URL:    $AuthServiceUrl"
Write-Host "Admin User:          $AdminUser"
Write-Host "Staff User:          $StaffUser"
Write-Host "Member 1 User (ID 1):$Member1User"
Write-Host "Member 2 User (ID 2):$Member2User"
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
        if ($Extra) { Write-Host "         Details: $Extra" -ForegroundColor DarkRed }
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
            TimeoutSec      = 6
            ErrorAction     = "Stop"
        }
        if ($Body) {
            $params["Body"] = $Body
            $params["ContentType"] = "application/json"
        }
        $resp = Invoke-WebRequest @params
        return @{
            StatusCode = $resp.StatusCode
            Content    = $resp.Content
        }
    } catch {
        $ex = $_.Exception.Response
        if ($ex) {
            $reader = New-Object System.IO.StreamReader($ex.GetResponseStream())
            $bodyText = $reader.ReadToEnd()
            return @{
                StatusCode = [int]$ex.StatusCode
                Content    = $bodyText
            }
        } else {
            return @{
                StatusCode = 0
                Content    = $_.Exception.Message
            }
        }
    }
}

function Get-UserToken {
    param([string]$Username, [string]$Password, [string]$RoleName)
    $loginBody = @{ username = $Username; password = $Password } | ConvertTo-Json
    $res = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/auth/login" -Body $loginBody
    if ($res.StatusCode -eq 200) {
        $json = $res.Content | ConvertFrom-Json
        Write-Host "  [PASS] Authenticated $Username ($RoleName) -> Received signed JWT" -ForegroundColor Green
        return $json.token
    } else {
        Write-Host "  [FAIL] Failed to authenticate $Username : HTTP $($res.StatusCode) $($res.Content)" -ForegroundColor Red
        return $null
    }
}

# -----------------------------------------------------------------------------
# STEP 1: Authenticate users and establish test tokens
# -----------------------------------------------------------------------------
Write-Host "[STEP 1/6] Authenticating Principals and Preparing Test Tokens..." -ForegroundColor Yellow

$adminToken = Get-UserToken -Username $AdminUser -Password $AdminPassword -RoleName "ROLE_ADMIN"
$staffToken = Get-UserToken -Username $StaffUser -Password $StaffPassword -RoleName "ROLE_STAFF"
$member1Token = Get-UserToken -Username $Member1User -Password $Member1Password -RoleName "ROLE_MEMBER (ID 1)"
$member2Token = Get-UserToken -Username $Member2User -Password $Member2Password -RoleName "ROLE_MEMBER (ID 2)"

# Register or login an unmapped member (a member account with NO memberId claim)
$unmappedUser = "unmapped_member"
$unmappedPass = "unmapped123"
$regPayload = @{
    username = $unmappedUser
    password = $unmappedPass
    email    = "unmapped@pulsefit.ai"
} | ConvertTo-Json
$null = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/auth/register" -Body $regPayload
$unmappedToken = Get-UserToken -Username $unmappedUser -Password $unmappedPass -RoleName "ROLE_MEMBER (Unmapped)"

if (-not $adminToken -or -not $staffToken -or -not $member1Token -or -not $member2Token -or -not $unmappedToken) {
    Write-Host "Authentication failed for required identities. Aborting verification." -ForegroundColor Red
    exit 1
}

$adminHeaders    = @{ "Authorization" = "Bearer $adminToken";    "Accept" = "application/json" }
$staffHeaders    = @{ "Authorization" = "Bearer $staffToken";    "Accept" = "application/json" }
$member1Headers  = @{ "Authorization" = "Bearer $member1Token";  "Accept" = "application/json" }
$member2Headers  = @{ "Authorization" = "Bearer $member2Token";  "Accept" = "application/json" }
$unmappedHeaders = @{ "Authorization" = "Bearer $unmappedToken"; "Accept" = "application/json" }
$invalidHeaders  = @{ "Authorization" = "Bearer eyJhbGciOiJIUzI1NiJ9.invalid.signature"; "Accept" = "application/json" }

Write-Host ""

# -----------------------------------------------------------------------------
# STEP 2: Unauthenticated and Invalid Token Enforcement (Expecting HTTP 401)
# -----------------------------------------------------------------------------
Write-Host "[STEP 2/6] Verifying Unauthenticated & Invalid Token Requests (HTTP 401)..." -ForegroundColor Yellow

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/1"
Check-Result -Description "Missing Token: GET /api/members/1" -ActualCode $r.StatusCode -ExpectedCodes @(401)

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/1" -Headers $invalidHeaders
Check-Result -Description "Invalid Token: GET /api/members/1" -ActualCode $r.StatusCode -ExpectedCodes @(401)

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/1"
Check-Result -Description "Missing Token: GET /api/subscriptions/member/1" -ActualCode $r.StatusCode -ExpectedCodes @(401)

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/1"
Check-Result -Description "Missing Token: GET /api/attendance/member/1" -ActualCode $r.StatusCode -ExpectedCodes @(401)

Write-Host ""

# -----------------------------------------------------------------------------
# STEP 3: Member Service Object-Level Ownership (BOLA/IDOR Prevention)
# -----------------------------------------------------------------------------
Write-Host "[STEP 3/6] Verifying Member Service Object Ownership (/api/members/*)..." -ForegroundColor Yellow

# 1. MEMBER 1 accesses own profile (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/1" -Headers $member1Headers
Check-Result -Description "MEMBER 1 accesses own profile (GET /api/members/1)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 2. MEMBER 1 attempts to access MEMBER 2 profile (Expect 403 Forbidden - BOLA PREVENTED)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/2" -Headers $member1Headers
Check-Result -Description "MEMBER 1 denied access to Member 2 profile (GET /api/members/2)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 3. MEMBER 1 accesses own status (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/1/status" -Headers $member1Headers
Check-Result -Description "MEMBER 1 accesses own status (GET /api/members/1/status)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 4. MEMBER 1 attempts to access MEMBER 2 status (Expect 403 Forbidden - BOLA PREVENTED)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/2/status" -Headers $member1Headers
Check-Result -Description "MEMBER 1 denied access to Member 2 status (GET /api/members/2/status)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 5. MEMBER 2 accesses own profile (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/2" -Headers $member2Headers
Check-Result -Description "MEMBER 2 accesses own profile (GET /api/members/2)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 6. MEMBER 2 attempts to access MEMBER 1 profile (Expect 403 Forbidden - BOLA PREVENTED)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/1" -Headers $member2Headers
Check-Result -Description "MEMBER 2 denied access to Member 1 profile (GET /api/members/1)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 7. Unmapped MEMBER (no memberId claim) attempts to access Member 1 profile (Expect 403 Forbidden)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/1" -Headers $unmappedHeaders
Check-Result -Description "Unmapped MEMBER denied access to Member 1 profile (GET /api/members/1)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 8. STAFF can access Member 1 and Member 2 profiles (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/1" -Headers $staffHeaders
Check-Result -Description "STAFF authorized to access Member 1 profile (GET /api/members/1)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/2" -Headers $staffHeaders
Check-Result -Description "STAFF authorized to access Member 2 profile (GET /api/members/2)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 9. ADMIN can access Member 1 and Member 2 profiles (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/members/1" -Headers $adminHeaders
Check-Result -Description "ADMIN authorized to access Member 1 profile (GET /api/members/1)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

Write-Host ""

# -----------------------------------------------------------------------------
# STEP 4: Subscription Service Object-Level Ownership (BOLA/IDOR Prevention)
# -----------------------------------------------------------------------------
Write-Host "[STEP 4/6] Verifying Subscription Service Object Ownership (/api/subscriptions/*)..." -ForegroundColor Yellow

# 1. MEMBER 1 accesses own subscriptions (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/1" -Headers $member1Headers
Check-Result -Description "MEMBER 1 accesses own subscriptions (GET /api/subscriptions/member/1)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 2. MEMBER 1 accesses own active subscription (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/1/active" -Headers $member1Headers
Check-Result -Description "MEMBER 1 accesses own active subscription (GET /api/subscriptions/member/1/active)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 3. MEMBER 1 attempts to access MEMBER 2 subscriptions (Expect 403 Forbidden - BOLA PREVENTED)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/2" -Headers $member1Headers
Check-Result -Description "MEMBER 1 denied access to Member 2 subscriptions (GET /api/subscriptions/member/2)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 4. MEMBER 1 attempts to access MEMBER 2 active subscription (Expect 403 Forbidden - BOLA PREVENTED)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/2/active" -Headers $member1Headers
Check-Result -Description "MEMBER 1 denied access to Member 2 active subscription (GET /api/subscriptions/member/2/active)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 5. MEMBER 2 accesses own subscriptions (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/2" -Headers $member2Headers
Check-Result -Description "MEMBER 2 accesses own subscriptions (GET /api/subscriptions/member/2)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 6. MEMBER 2 attempts to access MEMBER 1 subscriptions (Expect 403 Forbidden - BOLA PREVENTED)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/1" -Headers $member2Headers
Check-Result -Description "MEMBER 2 denied access to Member 1 subscriptions (GET /api/subscriptions/member/1)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 7. Unmapped MEMBER attempts to access Member 1 subscriptions (Expect 403 Forbidden)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/1" -Headers $unmappedHeaders
Check-Result -Description "Unmapped MEMBER denied access to Member 1 subscriptions (GET /api/subscriptions/member/1)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 8. STAFF can access Member 1 subscriptions (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/1" -Headers $staffHeaders
Check-Result -Description "STAFF authorized to access Member 1 subscriptions (GET /api/subscriptions/member/1)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 9. ADMIN can access Member 2 subscriptions (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/subscriptions/member/2" -Headers $adminHeaders
Check-Result -Description "ADMIN authorized to access Member 2 subscriptions (GET /api/subscriptions/member/2)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 10. Request body BOLA: MEMBER 1 attempts to purchase/create subscription for Member 2 (Expect 403 Forbidden)
$subCreateBody = @{
    memberId     = 2
    planId       = 1
    startDate    = "2026-11-02"
    facilityTier = "ALL_ACCESS"
    autoRenew    = $false
} | ConvertTo-Json
$r = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/subscriptions" -Headers $member1Headers -Body $subCreateBody
Check-Result -Description "MEMBER 1 denied creating subscription for Member 2 in payload (POST /api/subscriptions)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

Write-Host ""

# -----------------------------------------------------------------------------
# STEP 5: Attendance Service Object-Level Ownership (BOLA/IDOR Prevention)
# -----------------------------------------------------------------------------
Write-Host "[STEP 5/6] Verifying Attendance Service Object Ownership (/api/attendance/*)..." -ForegroundColor Yellow

# 1. MEMBER 1 accesses own attendance history (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/1" -Headers $member1Headers
Check-Result -Description "MEMBER 1 accesses own attendance history (GET /api/attendance/member/1)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 2. MEMBER 1 attempts to access MEMBER 2 attendance history (Expect 403 Forbidden - BOLA PREVENTED)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/2" -Headers $member1Headers
Check-Result -Description "MEMBER 1 denied access to Member 2 attendance (GET /api/attendance/member/2)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 3. MEMBER 2 accesses own attendance history (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/2" -Headers $member2Headers
Check-Result -Description "MEMBER 2 accesses own attendance history (GET /api/attendance/member/2)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 4. MEMBER 2 attempts to access MEMBER 1 attendance history (Expect 403 Forbidden - BOLA PREVENTED)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/1" -Headers $member2Headers
Check-Result -Description "MEMBER 2 denied access to Member 1 attendance (GET /api/attendance/member/1)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 5. Unmapped MEMBER attempts to access Member 1 attendance history (Expect 403 Forbidden)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/1" -Headers $unmappedHeaders
Check-Result -Description "Unmapped MEMBER denied access to Member 1 attendance (GET /api/attendance/member/1)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

# 6. STAFF can access Member 1 attendance history (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/1" -Headers $staffHeaders
Check-Result -Description "STAFF authorized to access Member 1 attendance (GET /api/attendance/member/1)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 7. ADMIN can access Member 2 attendance history (Expect 200)
$r = Invoke-ApiRequest -Uri "$GatewayUrl/api/attendance/member/2" -Headers $adminHeaders
Check-Result -Description "ADMIN authorized to access Member 2 attendance (GET /api/attendance/member/2)" -ActualCode $r.StatusCode -ExpectedCodes @(200)

# 8. Request body BOLA: MEMBER 1 attempts turnstile check-in on behalf of Member 2 (Expect 403 Forbidden)
$checkInBody = @{
    memberId     = 2
    facilityId   = "FACILITY_DOWNTOWN"
    facilityName = "PulseFit Downtown Elite"
} | ConvertTo-Json
$r = Invoke-ApiRequest -Method "POST" -Uri "$GatewayUrl/api/attendance/check-in" -Headers $member1Headers -Body $checkInBody
Check-Result -Description "MEMBER 1 denied turnstile check-in on behalf of Member 2 (POST /api/attendance/check-in)" -ActualCode $r.StatusCode -ExpectedCodes @(403)

Write-Host ""

# -----------------------------------------------------------------------------
# STEP 6: Verification Results Summary
# -----------------------------------------------------------------------------
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Verification Summary: $passCount Passed, $failCount Failed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "======================================================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    Write-Host "Object-Level Authorization verification FAILED. Please review the failures above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "All Object-Level Authorization (BOLA/IDOR) checks PASSED successfully!" -ForegroundColor Green
    exit 0
}
