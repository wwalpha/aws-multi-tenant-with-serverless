# Build Stage
FROM node:14-alpine as build

WORKDIR /usr/local/app
ARG TARGET_FOLDER


# COPY files
ADD $TARGET_FOLDER .
ADD typings/ typings/

RUN apk update && apk add git && \
  yarn install  && \
  yarn build

# Release Stage
FROM node:14-alpine
# working dir
WORKDIR /usr/local/app/
# environment variables
ENV CONTAINER_PORT=80

COPY --from=build /usr/local/app/dist .
COPY --from=build /usr/local/app/package.json .

RUN apk update && apk add git
RUN yarn install --production --no-lockfile

EXPOSE $CONTAINER_PORT

CMD [ "yarn", "start"]