$files = @("js\profile.js", "js\academy.js", "academy.html")
foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace "(?s)<<<<<<< HEAD.*?=======\r?\n", ""
    $content = $content -replace ">>>>>>> 8f5444b73ddbf556582c54dea1e6e982071307c5\r?\n", ""
    Set-Content $file -Value $content
}
