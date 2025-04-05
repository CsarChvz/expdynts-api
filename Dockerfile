# Usar Bun slim como base
FROM oven/bun:1.2.8-slim

# Evitar crear archivos extras con npm/bun
ENV NODE_ENV=production

# Crear y establecer el directorio de trabajo
WORKDIR /app

# Copiar solo los archivos necesarios para la instalación
COPY package.json bun.lock* ./

# Instalar solo dependencias de producción y limpiar caché
RUN bun install --frozen-lockfile --production && \
    rm -rf /root/.bun/install/cache

# Copiar el código con exclusiones específicas usando .dockerignore
COPY . .

# Exponer el puerto de la aplicación
EXPOSE 3000

# Eliminar la línea problemática de cambio de usuario
# USER node

# Usar exec form para CMD y configurar para producción
CMD ["bun", "run", "start"]