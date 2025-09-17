# Stage 1: build
FROM node:18-alpine AS build
WORKDIR /app
# Install build deps
RUN apk add --no-cache python3 make g++
# create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -h /app


# Copy package files first for layer caching
COPY app/package.json app/package-lock.json ./
RUN npm ci --production=false


# Copy source
COPY app/src ./src


# Build step (if any). For plain Node.js app there may be no build.
# RUN npm run build


# Remove dev deps and keep production modules
RUN npm prune --production


# Stage 2: runtime
# Using distroless minimal runtime for Node
FROM gcr.io/distroless/nodejs:18


# Create app directory
WORKDIR /app


# Copy from builder with proper ownership
COPY --from=build /app /app


# Use non-root user (distroless images contain non-root user 'nonroot')
USER nonroot:nonroot


EXPOSE 8080
CMD ["src/index.js"]