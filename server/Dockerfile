# Server Dockerfile
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace packages
COPY shared ./shared
COPY server ./server

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package first
WORKDIR /app/shared
RUN pnpm build

# Build server
WORKDIR /app/server
RUN pnpm build

# Expose server port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
