FROM oven/bun:1.2.8-slim

# Set environment variables to avoid compilation
ENV BETTER_SQLITE3_USE_PREBUILT=true
ENV NODE_ENV=production

# Add Python for any builds that might still be necessary
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

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