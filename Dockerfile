# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Add build arguments for Vite
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .
RUN npm run build

# Stage 3: Production
FROM node:18-alpine
WORKDIR /app

# Copy frontend build
COPY --from=frontend-build /app/dist ./dist

# Copy backend build
COPY --from=backend-build /app/server/dist ./server/dist
COPY --from=backend-build /app/server/package*.json ./server/
COPY --from=backend-build /app/server/node_modules ./server/node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start server
WORKDIR /app/server
CMD ["npm", "start"]
