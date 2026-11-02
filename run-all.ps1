param (
    [switch]$WithFrontend = $false
)

# PulseFIT AI - Microservices Startup Script
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   Starting PulseFIT AI Platform                    " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

function Start-ServiceWindow($name, $path, $port, $jarFile, $extraArgs = "") {
    Write-Host "[Starting] $name on Port $port..." -ForegroundColor Green
    $jarPath = "$path\target\$jarFile"
    if (Test-Path $jarPath) {
        $command = "`$host.UI.RawUI.WindowTitle = '$name (Port $port)'; cd '$path'; Write-Host 'Starting $name (Fast JAR Mode) on port $port...' -ForegroundColor Cyan; java -jar 'target\$jarFile' $extraArgs"
    } else {
        $argString = if ($extraArgs) { " -Dspring-boot.run.arguments='$extraArgs'" } else { "" }
        $command = "`$host.UI.RawUI.WindowTitle = '$name (Port $port)'; cd '$path'; Write-Host 'Starting $name (Maven Mode) on port $port...' -ForegroundColor Cyan; mvn spring-boot:run$argString"
    }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
}

# 1. Start Eureka Server first
Start-ServiceWindow "Eureka Discovery Server" "$baseDir\eureka-server" 8761 "eureka-server-1.0.0.jar"
Write-Host "Waiting 8 seconds for Eureka Server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 2. Start Core Business Services
Start-ServiceWindow "Auth Service" "$baseDir\auth-service" 8081 "auth-service-1.0.0.jar"
Start-ServiceWindow "Member Service (Inst 1)" "$baseDir\member-service" 8082 "member-service-1.0.0.jar"
Start-ServiceWindow "Member Service (Inst 2)" "$baseDir\member-service" 8085 "member-service-1.0.0.jar" "--server.port=8085"
Start-ServiceWindow "Subscription Service" "$baseDir\subscription-service" 8083 "subscription-service-1.0.0.jar"
Start-ServiceWindow "Attendance Service" "$baseDir\attendance-service" 8084 "attendance-service-1.0.0.jar"

Write-Host "Waiting 6 seconds before starting API Gateway..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

# 3. Start API Gateway
Start-ServiceWindow "API Gateway" "$baseDir\api-gateway" 8080 "api-gateway-1.0.0.jar"

if ($WithFrontend) {
    Write-Host "[Starting] Frontend Dashboard on Port 3000..." -ForegroundColor Green
    $frontendCommand = "`$host.UI.RawUI.WindowTitle = 'PulseFIT Frontend (Port 3000)'; cd '$baseDir\frontend'; Write-Host 'Starting Frontend Dev Server...' -ForegroundColor Cyan; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand
}

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "All requested services have been launched!" -ForegroundColor Green
Write-Host "Eureka Dashboard:           http://localhost:8761" -ForegroundColor White
Write-Host "API Gateway Ingress:        http://localhost:8080" -ForegroundColor White
Write-Host "Unified Gateway Swagger UI: http://localhost:8080/swagger-ui.html" -ForegroundColor Green
Write-Host "Swagger UI (Auth):          http://localhost:8081/swagger-ui/index.html" -ForegroundColor Yellow
Write-Host "Swagger UI (Member):        http://localhost:8082/swagger-ui/index.html" -ForegroundColor Yellow
Write-Host "Swagger UI (Subs):          http://localhost:8083/swagger-ui/index.html" -ForegroundColor Yellow
Write-Host "Swagger UI (Attnd):         http://localhost:8084/swagger-ui/index.html" -ForegroundColor Yellow
if ($WithFrontend) {
    Write-Host "Frontend Dashboard:  http://localhost:3000" -ForegroundColor White
}
Write-Host "====================================================" -ForegroundColor Cyan
