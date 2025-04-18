#base image
FROM node:20-alpine

#working directory
WORKDIR /app

#copy the files
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 5001

CMD ["npm", "start"]
