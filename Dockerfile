FROM oven/bun:1.2.8-slim

# Usa entorno no-root por seguridad y eficiencia
USER bun

WORKDIR /app

# Solo copiar lo necesario para instalar dependencias primero (aprovechar caching)
COPY --chown=bun:bun package.json bun.lock ./

# Instala solo dependencias de producción
RUN bun install --frozen-lockfile --production \
    && rm -rf /home/bun/.bun/install/cache \
    && bun pm cache clean

# Luego copia el resto del código
COPY --chown=bun:bun . .

# Elimina archivos innecesarios si los hubiera
RUN rm -rf tests/ docs/ *.md .git .github

EXPOSE 8000

CMD ["bun", "run", "start"]
