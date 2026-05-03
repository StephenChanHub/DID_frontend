# 第一阶段：构建阶段 (使用 Node.js 镜像进行打包)
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 第二阶段：生产阶段 (使用 Nginx 分发静态文件)
FROM nginx:stable-alpine as production-stage
# 将第一阶段生成的 dist 文件夹拷贝到 Nginx 的静态资源目录
COPY --from=build-stage /app/dist /usr/share/nginx/html
# 拷贝自定义的 Nginx 配置 (见下文)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 81
CMD ["nginx", "-g", "daemon off;"]