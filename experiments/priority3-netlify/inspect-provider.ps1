$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$workspaceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$artifactReview = Get-Content -LiteralPath (Join-Path $workspaceRoot 'docs/validation/node-provider-artifact-2026-11-07.json') -Raw | ConvertFrom-Json
$artifactZip = [IO.Path]::GetFullPath((Join-Path $workspaceRoot $artifactReview.archives[0].path))
$buildRoot = [IO.Path]::GetFullPath((Join-Path $workspaceRoot 'build')) + [IO.Path]::DirectorySeparatorChar
if (-not $artifactZip.StartsWith($buildRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Archive is outside workspace build directory' }
$unpacked = Join-Path ([IO.Path]::GetDirectoryName($artifactZip)) 'unpacked'
if (Test-Path -LiteralPath $unpacked) { throw 'Use a new archive directory; inspection never replaces an existing extraction' }
$archive = [IO.Compression.ZipFile]::OpenRead($artifactZip)
$canaryHits = [Collections.Generic.List[string]]::new()
$forbidden = [Collections.Generic.List[string]]::new()
$nativeFiles = [Collections.Generic.List[string]]::new()
$entryCount = 0
$uncompressedBytes = 0L
try {
    foreach ($entry in $archive.Entries) {
        $entryCount++
        $uncompressedBytes += $entry.Length
        if ($entry.FullName -match '(^/|^[A-Za-z]:|(^|[\\/])\.\.([\\/]|$)|(^|/)\.env($|[./])|(^|/)proof\.cjs$|(^|/)firebase\.emulator\.json$)') { $forbidden.Add($entry.FullName) }
        if ($entry.FullName.EndsWith('.node')) { $nativeFiles.Add($entry.FullName) }
        if ($entry.Length -gt 0) {
            $reader = [IO.StreamReader]::new($entry.Open())
            try { if ($reader.ReadToEnd().Contains($artifactReview.canary)) { $canaryHits.Add($entry.FullName) } } finally { $reader.Dispose() }
        }
    }
} finally { $archive.Dispose() }
if (-not ('negative-control-' + $artifactReview.canary).Contains($artifactReview.canary)) { throw 'Canary negative control failed' }
$report = @{ pass = ($canaryHits.Count -eq 0 -and $forbidden.Count -eq 0); entryCount = $entryCount; uncompressedBytes = $uncompressedBytes; canaryHits = @($canaryHits.ToArray()); forbiddenPaths = @($forbidden.ToArray()); nativeFiles = @($nativeFiles.ToArray()); extracted = $unpacked; verifiedAt = [DateTime]::UtcNow.ToString('o') }
if ($report.pass) { [IO.Compression.ZipFile]::ExtractToDirectory($artifactZip, $unpacked) }
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $workspaceRoot 'docs/validation/node-provider-inspection-2026-11-07.json') -Encoding UTF8
$report | ConvertTo-Json -Depth 6
if (-not $report.pass) { exit 1 }
