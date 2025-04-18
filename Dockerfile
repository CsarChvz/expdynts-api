# -------- STAGE 1: Build Stage --------
FROM oven/bun:1.2.8-slim AS builder

WORKDIR /app

# Aseguramos que el directorio de trabajo tiene permisos adecuados para el usuario `bun`
RUN mkdir -p /app && chown bun:bun /app  # Cambié el grupo de `bund` a `bun`

# Usamos usuario no-root
USER bun

# Copiamos solo archivos necesarios para instalación
COPY --chown=bun:bun package.json bun.lock ./

# Instalamos todas las dependencias (incluyendo dev)
RUN bun install --frozen-lockfile

# Copiamos el resto de la app
COPY --chown=bun:bun . .

# Opcional: Transpila o build si aplica (por ejemplo, TS a JS)
# RUN bun run build

# Limpieza del caché para minimizar el peso de la siguiente etapa
RUN rm -rf /home/bun/.bun/install/cache \
    && bun pm cache clean

# -------- STAGE 2: Production Image --------
FROM oven/bun:1.2.8-slim AS runner

WORKDIR /app

USER bun

# Solo copiamos los archivos necesarios desde builder
COPY --chown=bun:bun --from=builder /app /app

# Eliminamos código innecesario como tests, docs, etc.
RUN rm -rf tests/ docs/ *.md .git .github bun.lockb

EXPOSE 8000

CMD ["bun", "run", "start"]
