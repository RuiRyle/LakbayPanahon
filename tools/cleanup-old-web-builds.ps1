param([switch]$Apply)
$ErrorActionPreference='Stop'
$workspace=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$buildRoot=[IO.Path]::GetFullPath((Join-Path $workspace 'build'))
$references= @(& rg -o --no-filename 'student-web-[A-Za-z0-9]+' (Join-Path $workspace 'docs') (Join-Path $workspace 'tools') (Join-Path $workspace 'tests') (Join-Path $workspace 'functions') (Join-Path $workspace 'experiments') -g '!*.log' -g '!*.cpuprofile' -g '!package-lock.json')
if($LASTEXITCODE -gt 1){throw 'Reference scan failed.'}
$processes=Get-CimInstance Win32_Process -ErrorAction Stop
$commands=($processes | ForEach-Object CommandLine) -join "`n"
$folders=@(Get-ChildItem -LiteralPath $buildRoot -Directory -Filter 'student-web-*' | Sort-Object LastWriteTime -Descending)
$keep=@($folders | Select-Object -First 8 -ExpandProperty Name)+$references
$archive=Join-Path $buildRoot ('cleanup-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
$records=@()
foreach($folder in $folders){
 if($keep -contains $folder.Name -or $commands.Contains($folder.Name)){continue}
 $target=[IO.Path]::GetFullPath($folder.FullName)
 if([IO.Path]::GetDirectoryName($target) -ne $buildRoot -or $folder.Name -notmatch '^student-web-[A-Za-z0-9]+$'){throw 'Unexpected cleanup target.'}
 if($folder.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Linked build folder refused.'}
 $tracked=@(& git -C $workspace ls-files -- ('build/'+$folder.Name))
 if($LASTEXITCODE -ne 0 -or $tracked.Count){throw ('Tracked build refused: '+$target)}
 if(!(Test-Path -LiteralPath (Join-Path $target 'release-manifest.json')) -or !(Test-Path -LiteralPath (Join-Path $target 'public'))){continue}
 $items=@(Get-ChildItem -LiteralPath $target -Recurse -Force)
 if(@($items | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){throw ('Linked contents refused: '+$target)}
 $bytes=($items | Where-Object {!$_.PSIsContainer} | Measure-Object Length -Sum).Sum
 $record=[pscustomobject]@{path=$target;bytes=$bytes;deleted=$false}
 if($Apply){
  if(!(Test-Path -LiteralPath $archive)){New-Item -ItemType Directory -Path $archive | Out-Null}
  Copy-Item -LiteralPath (Join-Path $target 'release-manifest.json') -Destination (Join-Path $archive ($folder.Name+'-manifest.json'))
  # Absolute direct child of the validated build root; no links or tracked files.
  Remove-Item -LiteralPath $target -Recurse -Force
  $record.deleted=$true
 }
 $records+=$record
}
if($Apply){$records | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $archive 'removed-builds.json')}
[pscustomobject]@{applied=[bool]$Apply;folders=$records.Count;GiB=[math]::Round(($records | Measure-Object bytes -Sum).Sum/1GB,2);inventory=$archive} | ConvertTo-Json
