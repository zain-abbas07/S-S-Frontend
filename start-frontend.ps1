# PowerShell script to start the Vue frontend
Write-Host "Starting SS Frontend..." -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the development server
Write-Host "Starting Vue development server..." -ForegroundColor Green
npm run serve 