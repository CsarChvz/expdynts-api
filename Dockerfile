FROM oven/bun:1.2.8-slim

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production && \
    rm -rf /root/.bun/install/cache

# Copy application code
COPY . .

# INSTALAR CERTIFICADO SSL DE BRIGHT DATA
# Copiar el certificado al directorio correcto
COPY ./certs/bright-data-ca.crt /usr/local/share/ca-certificates/bright-data-ca.crt

# Instalar el paquete de certificados
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Instalar el certificado en el sistema
RUN update-ca-certificates

# Verificar que el certificado fue instalado (opcional - para debug)
RUN echo "Certificados instalados:" && \
    ls -la /usr/local/share/ca-certificates/ && \
    echo "Certificado agregado al bundle del sistema"

EXPOSE 8000
CMD ["bun", "run", "start"]