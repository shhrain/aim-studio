# syntax=docker/dockerfile:1.7
#
# AIM Studio 多阶段镜像（构建上下文为仓库根目录）
#   Next.js 应用：docker build -f deploy/Dockerfile --target next --build-arg APP=web .
#   Storybook：   docker build -f deploy/Dockerfile --target storybook .
#
# 推荐使用 deploy/deploy.sh（或 deploy.ps1）一键构建与启动，详见 docs/部署。

ARG NODE_IMAGE=node:24-alpine
ARG NGINX_IMAGE=nginx:1.27-alpine

# ---------------------------------------------------------------- base
FROM ${NODE_IMAGE} AS base
ARG NPM_REGISTRY=https://registry.npmjs.org
ARG PNPM_VERSION=9.15.7
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    STORYBOOK_DISABLE_TELEMETRY=1
RUN apk add --no-cache libc6-compat \
 && npm config set registry "${NPM_REGISTRY}" \
 && npm install -g "pnpm@${PNPM_VERSION}" \
 && pnpm config set registry "${NPM_REGISTRY}" \
 && pnpm config set store-dir /pnpm/store
WORKDIR /repo

# ---------------------------------------------------------------- deps
# 只依赖锁文件：源码改动不会使依赖层缓存失效
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc package.json ./
RUN --mount=type=cache,id=aim-pnpm-store,target=/pnpm/store \
    pnpm fetch --frozen-lockfile

FROM deps AS source
COPY . .
RUN --mount=type=cache,id=aim-pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile

# ---------------------------------------------------------------- next build
FROM source AS next-build
ARG APP
ARG NEXT_PUBLIC_API_MOCK=false
ARG NEXT_DIST_DIR=.next
ARG API_INTERNAL_URL=http://api:4000
ARG MOBILE_INTERNAL_URL=http://mobile:3000
ARG NEXT_PUBLIC_WEB_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_BASE=
ARG NEXT_PUBLIC_EDITOR_URL=http://localhost:3000
ARG NEXT_PUBLIC_MOBILE_URL=http://localhost:3001
ARG NEXT_PUBLIC_DOCS_URL=http://localhost:3002
ARG NEXT_PUBLIC_STORYBOOK_URL=
ENV API_INTERNAL_URL=${API_INTERNAL_URL} \
    MOBILE_INTERNAL_URL=${MOBILE_INTERNAL_URL} \
    NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL} \
    NEXT_OUTPUT=standalone \
    NEXT_DIST_DIR=${NEXT_DIST_DIR} \
    NEXT_PUBLIC_API_MOCK=${NEXT_PUBLIC_API_MOCK} \
    NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE} \
    NEXT_PUBLIC_EDITOR_URL=${NEXT_PUBLIC_EDITOR_URL} \
    NEXT_PUBLIC_MOBILE_URL=${NEXT_PUBLIC_MOBILE_URL} \
    NEXT_PUBLIC_DOCS_URL=${NEXT_PUBLIC_DOCS_URL} \
    NEXT_PUBLIC_STORYBOOK_URL=${NEXT_PUBLIC_STORYBOOK_URL}
RUN test -n "${APP}" || (echo "请通过 --build-arg APP=web|mobile|docs 指定应用" && exit 1)
RUN pnpm --filter "@aim/${APP}" build \
 && mkdir -p "apps/${APP}/public"

# ---------------------------------------------------------------- next runtime
FROM ${NODE_IMAGE} AS next
ARG APP
ARG NEXT_DIST_DIR=.next
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    APP=${APP}
WORKDIR /app
# libc6-compat：部分原生依赖需要；健康检查使用 Node fetch
RUN apk add --no-cache libc6-compat \
 && addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=next-build --chown=nextjs:nodejs /repo/apps/${APP}/${NEXT_DIST_DIR}/standalone ./
COPY --from=next-build --chown=nextjs:nodejs /repo/apps/${APP}/${NEXT_DIST_DIR}/static ./apps/${APP}/${NEXT_DIST_DIR}/static
COPY --from=next-build --chown=nextjs:nodejs /repo/apps/${APP}/public ./apps/${APP}/public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+(process.env.APP==='mobile'?'/m/api/health':'/api/health')).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "exec node apps/${APP}/server.js"]

# ---------------------------------------------------------------- storybook
FROM source AS storybook-build
RUN pnpm --filter @aim/storybook build

FROM ${NGINX_IMAGE} AS storybook
COPY deploy/nginx/storybook.conf /etc/nginx/conf.d/default.conf
COPY --from=storybook-build /repo/apps/storybook/storybook-static /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

FROM source AS api-build
RUN pnpm --filter @aim/api build && pnpm --filter @aim/api deploy --prod /out

FROM ${NODE_IMAGE} AS api
WORKDIR /app
RUN apk add --no-cache libc6-compat ffmpeg && addgroup -S -g 1001 aim && adduser -S -u 1001 -G aim aim && mkdir -p /data/files && chown -R aim:aim /data
COPY --from=api-build --chown=aim:aim /out ./
USER aim
ENV PORT=4000 STORAGE_PATH=/data/files
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:4000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","dist/server.js"]
