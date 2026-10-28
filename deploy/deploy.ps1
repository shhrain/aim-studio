<# AIM Studio 平台部署；配置输出不包含密码。 #>
param(
  [Parameter(Position=0)][ValidateSet('up','start','build','update','restart','stop','down','status','ps','logs','config','migrate','backup','restore','doctor','clean')][string]$Command='up',
  [Parameter(Position=1,ValueFromRemainingArguments=$true)][string[]]$Services,
  [string]$HostName,[switch]$Mirror,[switch]$NoCache,[switch]$Yes,[string]$BackupId
)
$ErrorActionPreference='Stop'
try { [Console]::OutputEncoding=[Text.UTF8Encoding]::new($false) } catch { }
$DeployDir=$PSScriptRoot
$EnvFile=Join-Path $DeployDir '.env'
function Secret { $bytes=New-Object byte[] 32; $rng=[Security.Cryptography.RandomNumberGenerator]::Create();$rng.GetBytes($bytes);$rng.Dispose();return ([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant() }
if(-not(Test-Path -LiteralPath $EnvFile)){Copy-Item -LiteralPath (Join-Path $DeployDir '.env.example') -Destination $EnvFile}
$content=Get-Content -LiteralPath $EnvFile -Raw
foreach($line in Get-Content -LiteralPath (Join-Path $DeployDir '.env.example')) {
  if($line -match '^([A-Z][A-Z0-9_]*)=') {
    $configKey=$Matches[1]
    if($content -notmatch "(?m)^$configKey="){$content+="`n$line"}
  }
}
foreach($key in @('POSTGRES_PASSWORD','BETTER_AUTH_SECRET')){if($content -match "(?m)^$key=\s*$"){$content=[regex]::Replace($content,"(?m)^$key=\s*$", "$key=$(Secret)")}}
[IO.File]::WriteAllText($EnvFile,$content,[Text.UTF8Encoding]::new($false))
foreach($line in Get-Content -LiteralPath $EnvFile){if($line -match '^([A-Z][A-Z0-9_]*)=(.*)$'){if(-not[Environment]::GetEnvironmentVariable($Matches[1])){[Environment]::SetEnvironmentVariable($Matches[1],$Matches[2].Trim())}}}
if($HostName){$env:PUBLIC_URL="http://${HostName}:$($env:WEB_PORT)";$env:DOCS_PUBLIC_URL="http://${HostName}:$($env:DOCS_PORT)"}
if($Mirror){$env:NPM_REGISTRY='https://registry.npmmirror.com'}
$selected=@($Services|Where-Object { $_ }|ForEach-Object{if($_ -eq 'editor'){Write-Warning 'editor 已更名为 web';'web'}else{$_}})
$allowed=@('web','mobile','docs','api','worker','postgres','gateway','mailpit','storybook','migrate')
foreach($service in $selected){if($service -notin $allowed){throw "未知服务：$service"}}
if($Command -eq 'config'){Write-Host "主站：$env:PUBLIC_URL`n移动端：$env:PUBLIC_URL/m`n文档：$env:DOCS_PUBLIC_URL`n模式：$env:APP_ENV`n通道：$env:PROVIDER_MODE`n配置：$EnvFile";exit 0}
if(-not(Get-Command docker -ErrorAction SilentlyContinue)){throw '未找到 Docker，请安装并启动 Docker Desktop / Docker Engine'}
& docker info --format '{{.ServerVersion}}';if($LASTEXITCODE -ne 0){throw 'Docker 服务尚未就绪'}
$Compose=@('compose','--env-file',$EnvFile,'-f',(Join-Path $DeployDir 'docker-compose.yml'))
if($env:APP_ENV -ne 'production'){$Compose+=@('--profile','dev')}
if($selected -contains 'storybook'){$Compose+=@('--profile','storybook')}
function Dc { param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments) & docker @Compose @Arguments;if($LASTEXITCODE -ne 0){throw "Docker Compose 执行失败：$($Arguments[0])"} }
function Smoke {
  foreach($url in @("$env:PUBLIC_URL/zh-CN","$env:PUBLIC_URL/api/v1/capabilities","$env:PUBLIC_URL/m/api/health","$env:DOCS_PUBLIC_URL/api/health")) {
    $response=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 20
    if($response.StatusCode -ne 200){throw "入口检查失败：$url"}
  }
  Write-Host '主站、API、移动端和文档入口检查通过'
}
function Backup {
  if($env:STORAGE_DRIVER -eq 's3'){throw 'S3 请先使用对象存储版本化快照；此脚本只处理本地卷，不能生成不完整备份'}
  $batch=Get-Date -Format 'yyyyMMdd-HHmmss';New-Item -ItemType Directory -Force -Path (Join-Path $DeployDir 'backups')|Out-Null
  Dc stop gateway web mobile api worker
  try { Dc run --rm -e "BATCH=$batch" backup -c 'set -eu; mkdir -p /backups/$BATCH; pg_dump -h postgres -U aim -d aim -Fc -f /backups/$BATCH/database.dump; tar -czf /backups/$BATCH/files.tar.gz -C /files .; echo complete > /backups/$BATCH/COMPLETE';Write-Host "备份完成：$batch" } finally { Dc start api worker web mobile gateway }
}
switch($Command){
  {$_ -in 'up','start','update'} { Dc config --quiet;if($_ -eq 'update'){Backup};$buildArgs=@('build');if($NoCache){$buildArgs+='--no-cache'};Dc @buildArgs;Dc up -d --wait --wait-timeout 180;Smoke;Write-Host "已启动：$env:PUBLIC_URL；邮件预览：http://localhost:$env:MAILPIT_PORT" }
  'build' {$a=@('build');if($NoCache){$a+='--no-cache'};Dc @a @selected}
  {$_ -in 'status','ps'} {Dc ps}
  'logs' {Dc logs --tail 200 -f @selected}
  'restart' {Dc restart @selected}
  'stop' {Dc stop @selected}
  {$_ -in 'down','clean'} {Dc down;Write-Host '容器已移除，数据库和素材卷已保留'}
  'migrate' {Dc up -d --wait postgres;Dc run --rm migrate}
  'doctor' {Dc config --quiet;Dc ps;Smoke}
  'backup' {Backup}
  'restore' {
    if(-not$Yes){throw '恢复会覆盖当前数据库，请指定 -Yes 和 -BackupId yyyyMMdd-HHmmss'}
    if($BackupId -notmatch '^\d{8}-\d{6}$'){throw '备份批次格式无效'}
    $backupRoot=[IO.Path]::GetFullPath((Join-Path $DeployDir 'backups'));$target=[IO.Path]::GetFullPath((Join-Path $backupRoot $BackupId))
    if(-not$target.StartsWith($backupRoot+[IO.Path]::DirectorySeparatorChar)-or -not(Test-Path -LiteralPath (Join-Path $target 'COMPLETE'))){throw '找不到完整的备份批次'}
    Dc stop gateway web mobile api worker
    Dc run --rm -e "BATCH=$BackupId" backup -c 'set -eu; test -s /backups/$BATCH/database.dump; tar -tzf /backups/$BATCH/files.tar.gz > /dev/null; psql -h postgres -U aim -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS aim WITH (FORCE);" -c "CREATE DATABASE aim;"; pg_restore -h postgres -U aim -d aim --single-transaction --exit-on-error /backups/$BATCH/database.dump; find /files -mindepth 1 -delete; tar -xzf /backups/$BATCH/files.tar.gz -C /files'
    Dc start api worker web mobile gateway;Write-Host '恢复完成，请执行 doctor 和业务冒烟检查'
  }
}
