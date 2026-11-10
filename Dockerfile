# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependencias primero para aprovechar la caché de Docker
COPY package*.json ./
RUN npm ci

# Copia el código fuente y compila
COPY . .
RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Elimina la configuración por defecto de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia la configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia los artefactos de build al directorio público de nginx
COPY --from=builder /app/dist/sistema-fut-alfonso-ugarte/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
