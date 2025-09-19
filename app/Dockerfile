# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -h /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source code
COPY app/src ./src

# Prune dev dependencies
RUN npm prune --production

# Stage 2: Runtime
FROM gcr.io/distroless/nodejs18

WORKDIR /app

# Copy from builder
COPY --from=build /app /app

# Use non-root user provided by distroless
USER nonroot:nonroot

EXPOSE 8080
CMD ["src/index.js"]
