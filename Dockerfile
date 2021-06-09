FROM node:12-slim AS build

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm run build

FROM node:12-slim

COPY package*.json .

COPY --from=build /usr/src/app/build .

RUN npm install --only=prod

CMD npm run production
