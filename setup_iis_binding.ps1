Import-Module WebAdministration

$siteName = "ITSM"
$hostHeader = "itsm.cybaemtech.app"
$port = 98
$certThumbprint = "AEFAA97E45DE70363BD6AEF5E4E82A576068383A"

# 1. Check if binding already exists
$existing = Get-WebBinding -Name $siteName -Port $port -Protocol "https" -HostHeader $hostHeader
if ($existing) {
    Write-Host "Binding for $hostHeader on port $port already exists. Removing it first..."
    Remove-WebBinding -Name $siteName -Port $port -Protocol "https" -HostHeader $hostHeader
}

# 2. Add HTTPS Binding with SNI
Write-Host "Adding HTTPS binding for $hostHeader on port $port with SNI..."
# SslFlags 1 means SNI enabled
New-WebBinding -Name $siteName -IPAddress "10.0.0.49" -Port $port -Protocol "https" -HostHeader $hostHeader -SslFlags 1

# 3. Assign the Certificate to the binding
# In IIS 10, we can use Get-Item to set the certificate
Write-Host "Assigning SSL certificate..."
$bindingPath = "IIS:\SslBindings\10.0.0.49!$port!$hostHeader"
Get-Item -Path "cert:\LocalMachine\My\$certThumbprint" | New-Item $bindingPath

Write-Host "Done! ITSM is now linked to $hostHeader on Port $port."
