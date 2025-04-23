# Base image
FROM node:18-alpine

# Set working directory 
WORKDIR /app

# Copy package files 
COPY package*.json ./

# Install dependencies 
RUN npm install --legacy-peer-deps


# Copy source code
COPY . .

# Expose port
EXPOSE 6000

# Start service
CMD ["npm", "start"]