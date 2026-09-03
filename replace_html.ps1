$search = @'
      <div class="hamburger" aria-expanded="false" aria-label="Toggle menu">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </div>
'@

$replace = @'
      <div class="mobile-actions">
        <a href="#" class="mobile-cart-btn" aria-label="Cart">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        </a>
        <div class="hamburger" aria-expanded="false" aria-label="Toggle menu">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </div>
      </div>
'@

Get-ChildItem -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match [regex]::Escape($search)) {
        $content = $content -replace [regex]::Escape($search), $replace
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Replaced in $($_.Name)"
    }
}
