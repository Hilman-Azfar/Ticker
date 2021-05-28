FROM node:14-slim

EXPOSE 5000

WORKDIR /app

COPY ./ .

RUN npm ci

CMD bash -c "tsnode index.ts"