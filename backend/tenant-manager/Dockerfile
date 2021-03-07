# Build Stage
FROM node:14-alpine as build

WORKDIR /usr/local/app

COPY . .

RUN apk update && apk add git
RUN yarn install
RUN yarn build

# Release Stage
FROM node:14-alpine
WORKDIR /usr/local/app

COPY --from=build /usr/local/app/dist .
COPY package.json .

RUN apk update && apk add git
RUN yarn install --production --no-lockfile

EXPOSE 8080

CMD [ "yarn", "start"]