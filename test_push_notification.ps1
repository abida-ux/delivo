$email = "pushtest$(Get-Random)@example.com"
$password = "TestPassword123"
$name = "Push Test User"
$phone = "254712345680"

# Create account
Write-Host "[*] Creating new account..."
$signupResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/users/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{name=$name; email=$email; password=$password; phone=$phone} | ConvertTo-Json) `
  -ErrorAction SilentlyContinue

$signupData = $signupResponse.Content | ConvertFrom-Json
if ($signupData.success) {
  Write-Host "[OK] Account created successfully"
  Write-Host "User ID: $($signupData.user.id)"
} else {
  Write-Host "[FAIL] Signup failed: $($signupData.message)"
  exit
}

# Now login to get a token
Write-Host "[*] Logging in..."
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/users/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{email=$email; password=$password} | ConvertTo-Json) `
  -ErrorAction SilentlyContinue

$loginData = $loginResponse.Content | ConvertFrom-Json
if ($loginData.success) {
  Write-Host "[OK] Login successful"
  $token = $loginData.token
  $userId = $loginData.user.id
} else {
  Write-Host "[FAIL] Login failed: $($loginData.message)"
  exit
}

# Register a dummy FCM token to trigger the welcome notification
Write-Host "[*] Registering FCM token..."
$fcmToken = "dummy_fcm_token_test_" + (Get-Random)
$fcmResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/notifications/fcm/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $token"} `
  -Body (@{fcmToken=$fcmToken; platform="web"} | ConvertTo-Json) `
  -ErrorAction SilentlyContinue

$fcmData = $fcmResponse.Content | ConvertFrom-Json
if ($fcmData.success) {
  Write-Host "[OK] FCM token registered"
  Write-Host "Token: $fcmToken"
} else {
  Write-Host "[FAIL] FCM registration failed: $($fcmData.message)"
}

Write-Host ""
Write-Host "[OK] Test complete!"
Write-Host "Check your browser console or notifications for the welcome message."
Write-Host ""
Write-Host "Account details:"
Write-Host "  Email: $email"
Write-Host "  Password: $password"
Write-Host "  User ID: $userId"
