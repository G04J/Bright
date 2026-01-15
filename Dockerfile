# ---------- Build stage ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Prisma client generation (needs prisma/schema.prisma present)
RUN npx prisma generate

# Build NestJS (outputs to /dist)
RUN npm run build


# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy only what we need at runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Cloud Run injects PORT. Your app should listen on process.env.PORT.
EXPOSE 8080

CMD ["node", "dist/main.js"]
