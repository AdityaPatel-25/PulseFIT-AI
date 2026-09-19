# PulseFIT AI - Packaging Helper Script
# Creates a clean, lightweight zip archive ready to send to friends or submit to evaluators

$projectRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$outputZip = "$projectRoot\..\PulseFIT-AI-Shared.zip"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   Packaging PulseFIT AI Project for Sharing        " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Project Folder: $projectRoot" -ForegroundColor Yellow
Write-Host "Output Zip:     $outputZip" -ForegroundColor Yellow

$tempDir = "$env:TEMP\PulseFIT-AI-Export"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "`nCopying project files (excluding node_modules and .git)..." -ForegroundColor Green

# Use robocopy to exclude heavy / environment-specific directories
robocopy "$projectRoot" "$tempDir" /E /XD "node_modules" ".git" ".metadata" ".vscode" ".tempmediaStorage" /XF "*.log" /NFL /NDL /NJH /NJS /nc /ns /np

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

Write-Host "Compressing files into $outputZip..." -ForegroundColor Green
Compress-Archive -Path "$tempDir\*" -DestinationPath "$outputZip" -CompressionLevel Optimal

# Cleanup temp folder
Remove-Item -Path $tempDir -Recurse -Force

$zipSize = (Get-Item $outputZip).Length / 1MB
Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "SUCCESS! Zip archive created successfully!" -ForegroundColor Green
Write-Host "File: $outputZip" -ForegroundColor White
Write-Host "Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor White
Write-Host "You can now send this zip file to your friends via Google Drive, WhatsApp, or Email!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
