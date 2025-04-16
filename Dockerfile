FROM oven/bun:1.2.8-slim

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production && \
    rm -rf /root/.bun/install/cache

# Copy application code
COPY . .

# Expose port and set start command
EXPOSE 3000
CMD ["bun", "run", "start"]