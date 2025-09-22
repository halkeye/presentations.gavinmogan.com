FROM node:22.19.0

COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
