FROM node:14-apline

WORKDIR /app

COPY ./ .

RUN npm ci

CMD bash -c "npm start"