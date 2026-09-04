$searchRegex = '(?s)(<div class="container nav-wrapper">\s*)<nav aria-label="Main Navigation">'
$replaceStr = '$1<a href="index.html" class="logo-link">
        <img src="images/logo/Logo_Dark_Mode.png" alt="IdeaChat Logo" class="logo-img dark-mode-logo">
        <img src="images/logo/Log_light_mode.png" alt="IdeaChat Logo" class="logo-img light-mode-logo">
      </a>
      <nav aria-label="Main Navigation">'

Get-ChildItem -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match $searchRegex) {
        $content = $content -replace $searchRegex, $replaceStr
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Restored logo in $($_.Name)"
    }
}
