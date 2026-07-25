FROM node:20-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all source files
COPY . .

EXPOSE 3000

# Start Next.js in development mode with hot-reloading
CMD ["npm", "run", "dev"]
