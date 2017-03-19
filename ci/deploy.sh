#!/bin/bash

export REPO=pmsipilot/jenklab-ci
export TAG=`if [ "$TRAVIS_BRANCH" == "master" ]; then echo "latest"; else echo $TRAVIS_BRANCH ; fi`

docker login -e $DOCKER_EMAIL -u $DOCKER_USER -p $DOCKER_PASS
docker build -f Dockerfile -t $REPO:$TAG .
docker push $REPO
