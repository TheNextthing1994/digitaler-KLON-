FROM node:22-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies without updating npm (as per user advice)
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Expose the port (standard for our environment and Zeabur)
EXPOSE 3000

# Start the application using the production script
CMD ["npm", "start"]
