FROM oven/bun:1.2.8-slim

WORKDIR /app

# Cache de dependencias (capa separada)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copia del código (capa final)
COPY . .

# Limpieza
RUN rm -rf /root/.bun/install/cache \
    && find . -name "*.test.*" -delete \
    && rm -rf src/__tests__

EXPOSE 3000
CMD ["bun", "run", "start"]