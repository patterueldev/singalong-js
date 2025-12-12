# Player App Dockerfile
FROM node:20-alpine

# Install pnpm and Expo CLI
RUN npm install -g pnpm @expo/ngrok

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./

# Copy all workspace packages
COPY shared ./shared
COPY ui-library ./ui-library
COPY player-app ./player-app

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
WORKDIR /app/shared
RUN pnpm build

# Build ui-library
WORKDIR /app/ui-library
RUN pnpm build || true

# Expose Expo dev server port
EXPOSE 3003

# Start player app
WORKDIR /app/player-app
CMD ["pnpm", "start", "--port", "3003"]
