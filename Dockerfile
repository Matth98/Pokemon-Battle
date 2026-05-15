FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY pokebattle-backend-server.js .

EXPOSE 5000

CMD ["node", "pokebattle-backend-server.js"]
