FROM node:14-slim

WORKDIR /app

COPY ./ /app

RUN npm ci

CMD npm run dev

EXPOSE 5000