#!/usr/bin/env bash
set -euo pipefail
DEPLOY_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DEPLOY_DIR/.env"
COMMAND="${1:-up}"; if [ $# -gt 0 ]; then shift; fi
TASK_HOST=''; NO_CACHE=''; MIRROR=''; YES=''; BATCH=''; SERVICES=()
while [ $# -gt 0 ]; do
  case "$1" in
    --host) TASK_HOST="$2"; shift 2;;
    --mirror) MIRROR=1; shift;;
    --no-cache) NO_CACHE=1; shift;;
    --yes) YES=1; shift;;
    --backup-id) BATCH="$2"; shift 2;;
    editor) echo 'editor 已更名为 web'; SERVICES+=(web); shift;;
    web|mobile|docs|api|worker|postgres|gateway|mailpit|storybook|migrate) SERVICES+=("$1"); shift;;
    *) echo "未知参数：$1" >&2; exit 1;;
  esac
done
if [ ! -f "$ENV_FILE" ]; then cp "$DEPLOY_DIR/.env.example" "$ENV_FILE"; chmod 600 "$ENV_FILE"; fi
while IFS= read -r line; do
  if [[ "$line" =~ ^([A-Z][A-Z0-9_]*)= ]] && ! grep -q "^${BASH_REMATCH[1]}=" "$ENV_FILE"; then printf '\n%s\n' "$line" >> "$ENV_FILE"; fi
done < "$DEPLOY_DIR/.env.example"
for key in POSTGRES_PASSWORD BETTER_AUTH_SECRET; do
  if grep -q "^$key=$" "$ENV_FILE"; then
    secret="$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')"
    sed "s/^$key=$/$key=$secret/" "$ENV_FILE" > "$ENV_FILE.tmp"
    chmod 600 "$ENV_FILE.tmp"; mv "$ENV_FILE.tmp" "$ENV_FILE"
  fi
done
while IFS='=' read -r key value; do
  if [[ "$key" =~ ^[A-Z][A-Z0-9_]*$ ]] && [ -z "${!key:-}" ]; then export "$key=${value%$'\r'}"; fi
done < "$ENV_FILE"
if [ -n "$TASK_HOST" ]; then export PUBLIC_URL="http://$TASK_HOST:${WEB_PORT:-3000}" DOCS_PUBLIC_URL="http://$TASK_HOST:${DOCS_PORT:-3002}"; fi
if [ -n "$MIRROR" ]; then export NPM_REGISTRY=https://registry.npmmirror.com; fi
if [ "$COMMAND" = config ]; then printf '主站：%s\n移动端：%s/m\n文档：%s\n模式：%s\n通道：%s\n' "$PUBLIC_URL" "$PUBLIC_URL" "$DOCS_PUBLIC_URL" "$APP_ENV" "$PROVIDER_MODE"; exit 0; fi
command -v docker >/dev/null || { echo '请安装 Docker Engine / Docker Desktop'; exit 1; }
docker info --format '{{.ServerVersion}}' >/dev/null
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/docker-compose.yml")
if [ "$APP_ENV" != production ]; then COMPOSE+=(--profile dev); fi
for service in "${SERVICES[@]}"; do if [ "$service" = storybook ]; then COMPOSE+=(--profile storybook); fi; done
dc() { "${COMPOSE[@]}" "$@"; }
smoke() {
  for url in "$PUBLIC_URL/zh-CN" "$PUBLIC_URL/api/v1/capabilities" "$PUBLIC_URL/m/api/health" "$DOCS_PUBLIC_URL/api/health"; do curl --fail --silent --show-error --max-time 20 "$url" -o /dev/null; done
  echo '主站、API、移动端和文档入口检查通过'
}
backup() {
  [ "$STORAGE_DRIVER" = local ] || { echo 'S3 请使用对象存储版本化快照；此脚本仅备份本地卷'; return 1; }
  local batch; batch="$(date +%Y%m%d-%H%M%S)"; mkdir -p "$DEPLOY_DIR/backups"
  dc stop gateway web mobile api worker
  if dc run --rm -e "BATCH=$batch" backup -c 'set -eu; mkdir -p /backups/$BATCH; pg_dump -h postgres -U aim -d aim -Fc -f /backups/$BATCH/database.dump; tar -czf /backups/$BATCH/files.tar.gz -C /files .; echo complete > /backups/$BATCH/COMPLETE'; then
    dc start api worker web mobile gateway; echo "备份完成：$batch"
  else dc start api worker web mobile gateway; return 1; fi
}
case "$COMMAND" in
  up|start|update)
    dc config --quiet
    if [ "$COMMAND" = update ]; then backup; fi
    if [ -n "$NO_CACHE" ]; then dc build --no-cache; else dc build; fi
    dc up -d --wait --wait-timeout 180; smoke; echo "已启动：$PUBLIC_URL；邮件预览：http://localhost:$MAILPIT_PORT";;
  build) if [ -n "$NO_CACHE" ]; then dc build --no-cache "${SERVICES[@]}"; else dc build "${SERVICES[@]}"; fi;;
  status|ps) dc ps;;
  logs) dc logs --tail 200 -f "${SERVICES[@]}";;
  restart|stop) dc "$COMMAND" "${SERVICES[@]}";;
  down|clean) dc down; echo '数据卷已保留';;
  migrate) dc up -d --wait postgres; dc run --rm migrate;;
  doctor) dc config --quiet; dc ps; smoke;;
  backup) backup;;
  restore)
    [[ -n "$YES" && "$BATCH" =~ ^[0-9]{8}-[0-9]{6}$ && -f "$DEPLOY_DIR/backups/$BATCH/COMPLETE" ]] || { echo '请提供 --yes --backup-id 有效备份批次'; exit 1; }
    dc stop gateway web mobile api worker
    dc run --rm -e "BATCH=$BATCH" backup -c 'set -eu; test -s /backups/$BATCH/database.dump; tar -tzf /backups/$BATCH/files.tar.gz > /dev/null; pg_restore -h postgres -U aim -d aim --single-transaction --exit-on-error --clean --if-exists /backups/$BATCH/database.dump; find /files -mindepth 1 -delete; tar -xzf /backups/$BATCH/files.tar.gz -C /files'
    dc start api worker web mobile gateway; echo '恢复完成，请验证业务';;
  *) echo "未知命令：$COMMAND"; exit 1;;
esac
