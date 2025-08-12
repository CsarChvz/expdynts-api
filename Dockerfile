FROM oven/bun:1.2.8-slim

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production && \
    rm -rf /root/.bun/install/cache

# Copy application code
COPY . .

# INSTALACIÓN DEL CERTIFICADO SSL DE BRIGHT DATA CON SCRIPT
# Instalar 'curl' y 'ca-certificates' para que el script funcione.
RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

# Descargar el script de instalación
RUN curl -o /tmp/brightdata_installer.sh https://raw.githubusercontent.com/luminati-io/ssl-certificate/main/BrightDataSSL_installer_Linux.sh

# Hacer el script ejecutable y forzar su ejecución sin interacción
RUN chmod +x /tmp/brightdata_installer.sh && \
    /tmp/brightdata_installer.sh
    
# Eliminar el archivo de script para mantener la imagen limpia
RUN rm /tmp/brightdata_installer.sh

# Exponer el puerto de la aplicación y definir el comando de inicio.
EXPOSE 8000
CMD ["bun", "run", "start"]