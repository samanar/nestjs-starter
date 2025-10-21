# Development Dockerfile with hot-reload
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Expose application port and debug port
EXPOSE 3000

# Start in development mode with watch
CMD ["npm", "run", "start:dev"]
