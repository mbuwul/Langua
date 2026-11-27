# Dutch course: tiny local web server (no install needed, uses Windows PowerShell).
# Started by "Start Dutch Course.bat". Close this window to stop the course.
param([string]$Root)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path $Root).Path.TrimEnd('\')
$port = 8737   # keep fixed: your progress is saved per address
$url  = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try { $listener.Start() } catch {
  # Already running (e.g. you double-clicked twice): just open the course.
  Start-Process ($url + 'index.html'); exit
}
$host.UI.RawUI.WindowTitle = 'Dutch course is running - close this window to stop it'
Write-Host ''
Write-Host '  Dutch course is running at' $url -ForegroundColor Cyan
Write-Host '  Keep this window open while you study. Close it when you are done.'
Write-Host ''
Start-Process ($url + 'index.html')
$types = @{ '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8';
  '.js'='text/javascript; charset=utf-8'; '.json'='application/json'; '.svg'='image/svg+xml'; '.png'='image/png';
  '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif'; '.webp'='image/webp'; '.ico'='image/x-icon';
  '.mp3'='audio/mpeg'; '.wav'='audio/wav'; '.ogg'='audio/ogg'; '.m4a'='audio/mp4'; '.woff2'='font/woff2'; '.txt'='text/plain; charset=utf-8' }
while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $res = $ctx.Response
  try {
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/').Replace('/', '\')
    if ($rel -eq '' -or $rel.EndsWith('\')) { $rel += 'index.html' }
    $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
    if ($full.StartsWith($Root + '\', [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $res.AddHeader('Cache-Control', 'no-cache')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch { try { $res.StatusCode = 500 } catch {} }
  finally { try { $res.Close() } catch {} }
}
