FROM node:14-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

COPY .babelrc ./

COPY ./src ./src

RUN npm install

RUN npm run build

FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY .babelrc ./

COPY .env ./

RUN mkdir -p ./output

COPY --from=build /usr/src/app/dist ./

RUN npm install --only=prod

CMD npm run prod
