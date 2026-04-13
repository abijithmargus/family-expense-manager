FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install serve to run the preview server
RUN npm install -g serve

# Copy built files
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 5173

# Run preview server
CMD ["serve", "-s", "dist", "-l", "5173"]