# ========================
# 阶段1: Node.js 构建阶段
# ========================
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制项目文件（排除 node_modules 和 dist）
COPY . ./

# 仅复制 package.json 和 package-lock.json 以利用 Docker 缓存
RUN rm -rf node_modules dist && \
    npm ci --silent && \
    npm run build

# ========================
# 阶段2: Caddy 运行阶段
# ========================
FROM caddy:alpine AS final

# 设置工作目录
WORKDIR /srv

# 复制构建产物和 Caddy 配置
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/Caddyfile .

# 暴露 Caddy 默认端口 (80)
EXPOSE 80

# 启动 Caddy 服务（自动加载当前目录的 Caddyfile）
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]