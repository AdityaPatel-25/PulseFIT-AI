param (
    [switch]$WithFrontend = $false
)

# PulseFIT AI - Microservices Startup Script
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   Starting PulseFIT AI Platform                    " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

function Start-ServiceWindow($name, $path, $port) {
    Write-Host "[Starting] $name on Port $port..." -ForegroundColor Green
    $command = "`$host.UI.RawUI.WindowTitle = '$name (Port $port)'; cd '$path'; Write-Host 'Starting $name on port $port...' -ForegroundColor Cyan; mvn spring-boot:run"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
}

# 1. Start Eureka Server first
Start-ServiceWindow "Eureka Discovery Server" "$baseDir\eureka-server" 8761
Write-Host "Waiting 10 seconds for Eureka Server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 2. Start Core Business Services
Start-ServiceWindow "Auth Service" "$baseDir\auth-service" 8081
Start-ServiceWindow "Member Service" "$baseDir\member-service" 8082
Start-ServiceWindow "Subscription Service" "$baseDir\subscription-service" 8083
Start-ServiceWindow "Attendance Service" "$baseDir\attendance-service" 8084

Write-Host "Waiting 8 seconds before starting API Gateway..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 3. Start API Gateway
Start-ServiceWindow "API Gateway" "$baseDir\api-gateway" 8080

if ($WithFrontend) {
    Write-Host "[Starting] Frontend Dashboard on Port 3000..." -ForegroundColor Green
    $frontendCommand = "`$host.UI.RawUI.WindowTitle = 'PulseFIT Frontend (Port 3000)'; cd '$baseDir\frontend'; Write-Host 'Starting Frontend Dev Server...' -ForegroundColor Cyan; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand
}

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "All requested services have been launched!" -ForegroundColor Green
Write-Host "Eureka Dashboard:    http://localhost:8761" -ForegroundColor White
Write-Host "API Gateway Ingress: http://localhost:8080" -ForegroundColor White
if ($WithFrontend) {
    Write-Host "Frontend Dashboard:  http://localhost:3000" -ForegroundColor White
}
Write-Host "====================================================" -ForegroundColor Cyan
