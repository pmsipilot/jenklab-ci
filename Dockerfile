FROM node:alpine

ENV NODE_ENV=production
STOPSIGNAL SIGTERM

RUN apk update && \
    apk add yarn

RUN mkdir -p /jenklab-ci/src && \
    mkdir -p /jenklab-ci/bin

ADD src/ /jenklab-ci/src
ADD bin/ /jenklab-ci/bin
ADD package.json /jenklab-ci/
ADD yarn.lock /jenklab-ci/

WORKDIR /jenklab-ci
RUN yarn

RUN ln -s /jenklab-ci/bin/jenklab-ci /usr/local/bin/jenklab-ci

ENTRYPOINT /bin/sh
