FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

# Install mysql-client for database backups
RUN apk add --no-cache mysql-client

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
