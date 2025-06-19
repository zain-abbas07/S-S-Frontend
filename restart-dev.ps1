# PowerShell script to restart the Vue development server
Write-Host "Restarting Vue development server..." -ForegroundColor Green

# Stop any running processes on port 8080 (Vue dev server)
Write-Host "Stopping any existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Clear node_modules and reinstall (optional, uncomment if needed)
# Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
# Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
# npm install

# Start the development server
Write-Host "Starting Vue development server..." -ForegroundColor Green
npm run serve 