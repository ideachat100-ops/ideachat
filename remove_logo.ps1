$searchRegex = '(?s)(<div class="container nav-wrapper">\s*)<a href="index\.html" class="logo-link">\s*<img src="images/logo/Logo_Dark_Mode\.png" alt="IdeaChat Logo" class="logo-img dark-mode-logo">\s*<img src="images/logo/Log_light_mode\.png" alt="IdeaChat Logo" class="logo-img light-mode-logo">\s*</a>'
$replaceStr = '$1'

Get-ChildItem -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match $searchRegex) {
        $content = $content -replace $searchRegex, $replaceStr
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Removed logo from $($_.Name)"
    }
}
