FROM node:12-slim AS build

WORKDIR /usr/src/app

COPY package*.json ./

COPY .babelrc ./

COPY .npmrc ./

COPY .env ./

COPY ./src ./src

RUN npm install

RUN npm run build

FROM node:12-slim

WORKDIR /usr/src/app

COPY package*.json ./

COPY .npmrc ./

RUN  mkdir -p ./data && mkdir -p ./job

COPY --from=build /usr/src/app/dist ./

RUN npm install --only=prod

CMD npm run prod
