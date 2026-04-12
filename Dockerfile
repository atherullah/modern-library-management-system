# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy installed node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create upload directories (multer needs these at runtime)
RUN mkdir -p public/images public/user_images

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "app.js"]
