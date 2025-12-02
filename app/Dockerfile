# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN npm run build

# Runtime stage (smaller image)
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 3000

# Env vars (default)
ENV PORT=3000
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/index.js"]
