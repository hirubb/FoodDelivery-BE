# Base image
FROM node:18-alpine

# Set working directory 
WORKDIR /app

# Copy package files 
COPY package*.json ./

# Install dependencies 
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5001

# Start service
CMD ["npm", "run" , "dev"]