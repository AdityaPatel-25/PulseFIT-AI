param (
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$AuthServiceUrl = "http://localhost:8081"
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================================"
Write-Host "PulseFIT AI - Milestone 4B: CRUD & Feign Verification via API Gateway"
Write-Host "======================================================================"

# 1. Login
$loginPayload = '{"username":"admin","password":"admin123"}'
$loginResp = Invoke-RestMethod -Uri "$AuthServiceUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
$jwt = $loginResp.token
$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type"  = "application/json"
    "Accept"        = "application/json"
}

# 2. Member CRUD
Write-Host "`n[1] Testing Member CRUD..."
$newMember = @{
    name = "Robert Test"
    contact = "+1-555-8888"
    email = "robert.test@pulsefit.com"
    address = "456 Fitness Blvd"
    emergencyContact = "+1-555-9999"
} | ConvertTo-Json

# CREATE
$createdMember = Invoke-RestMethod -Uri "$GatewayUrl/api/members" -Method Post -Headers $headers -Body $newMember
$memberId = $createdMember.memberId
Write-Host "  [PASS] Created Member ID: $memberId ($($createdMember.name))"

# READ
$retrievedMember = Invoke-RestMethod -Uri "$GatewayUrl/api/members/$memberId" -Method Get -Headers $headers
Write-Host "  [PASS] Retrieved Member ID: $($retrievedMember.memberId) Status: $($retrievedMember.status)"

# UPDATE
$updatePayload = @{
    name = "Robert Updated"
    contact = "+1-555-8888"
    email = "robert.test@pulsefit.com"
    address = "789 New Gym Way"
    emergencyContact = "+1-555-9999"
} | ConvertTo-Json
$updatedMember = Invoke-RestMethod -Uri "$GatewayUrl/api/members/$memberId" -Method Put -Headers $headers -Body $updatePayload
Write-Host "  [PASS] Updated Member name to: $($updatedMember.name)"

# 3. Subscription CRUD (Involves Feign -> Member Service)
Write-Host "`n[2] Testing Subscription CRUD (Feign Client -> Member Service)..."
# Get available plans
$plans = Invoke-RestMethod -Uri "$GatewayUrl/api/plans" -Method Get -Headers $headers
$planId = $plans[0].planId
Write-Host "  [PASS] Retrieved active plan ID: $planId ($($plans[0].planName))"

# CREATE Subscription for the newly created member (Subscription Service Feign calls Member Service to verify member!)
$subPayload = @{
    memberId = $memberId
    planId = $planId
} | ConvertTo-Json
$createdSub = Invoke-RestMethod -Uri "$GatewayUrl/api/subscriptions" -Method Post -Headers $headers -Body $subPayload
$subId = $createdSub.subscriptionId
Write-Host "  [PASS] Created Subscription ID: $subId for Member: $memberId (Feign communication successful!)"

# READ Subscription
$retrievedSub = Invoke-RestMethod -Uri "$GatewayUrl/api/subscriptions/$subId" -Method Get -Headers $headers
Write-Host "  [PASS] Retrieved Subscription ID: $($retrievedSub.subscriptionId) Status: $($retrievedSub.status)"

# DELETE Subscription (Soft delete / cancel)
$deleteSub = Invoke-RestMethod -Uri "$GatewayUrl/api/subscriptions/$subId" -Method Delete -Headers $headers
Write-Host "  [PASS] Deleted Subscription ID: $subId"

# 4. Attendance
Write-Host "`n[3] Testing Attendance Service..."
$attendanceList = Invoke-RestMethod -Uri "$GatewayUrl/api/attendance/recent" -Method Get -Headers $headers
Write-Host "  [PASS] Retrieved $($attendanceList.Count) recent attendance records"

# 5. Cleanup Member
$deleteMember = Invoke-RestMethod -Uri "$GatewayUrl/api/members/$memberId" -Method Delete -Headers $headers
Write-Host "  [PASS] Cleaned up Member ID: $memberId"

Write-Host "`n[SUCCESS] All CRUD operations and Feign inter-service calls verified successfully with JWT!"
