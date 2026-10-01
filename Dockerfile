# frontend/Dockerfile
# CATATAN: belum ada di upload asli — dibuat mengikuti nginx.container.conf
# yang sudah disediakan. Sesuaikan build tool (vite/webpack/dll) dan
# ARG/ENV dengan proyek frontend Anda yang sebenarnya.

FROM node:20-alpine AS builder
WORKDIR /app

ARG API_BASE_URL
ENV VITE_API_BASE_URL=$API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.container.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
