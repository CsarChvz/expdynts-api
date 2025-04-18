# Etapa de construcción
FROM oven/bun:1.2.8-slim AS builder

WORKDIR /build

# Copiar solo los archivos necesarios para instalar dependencias
COPY package.json bun.lock* ./

# Instalar dependencias
RUN bun install --frozen-lockfile --production

# Copiar el código de la aplicación
COPY . .

# Etapa de producción
FROM oven/bun:1.2.8-slim AS production

# Crear un usuario no privilegiado
RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 --gid 1001 bunuser

WORKDIR /app

# Copiar solo los archivos necesarios desde la etapa de construcción
COPY --from=builder --chown=bunuser:bunuser /build/node_modules ./node_modules
COPY --from=builder --chown=bunuser:bunuser /build/package.json ./package.json
COPY --from=builder --chown=bunuser:bunuser /build/src ./src
COPY --from=builder --chown=bunuser:bunuser /build/public ./public

# Copiar el archivo .env si existe
COPY --from=builder --chown=bunuser:bunuser /build/.env ./.env

# Cambiar al usuario no privilegiado
USER bunuser

#Expose
EXPOSE 8000

# Usar un comando más específico según tu aplicación
CMD ["bun", "run", "start"]