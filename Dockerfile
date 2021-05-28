FROM node:14-slim

EXPOSE 5000

WORKDIR /app

COPY ./ .

RUN npm ci

CMD npm run dev