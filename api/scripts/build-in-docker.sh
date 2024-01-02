#!/usr/bin/env bash

set -e

IMAGE_NAME=worth-of-words-api
ZIP_NAME=lambda.zip

docker build . -t $IMAGE_NAME
mkdir -p dist/
rm -rf dist/*
id=$(docker create $IMAGE_NAME)
docker cp $id:/usr/src/app/ dist/
docker rm -v $id
cd dist/app
zip -r ../lambda.zip *
cd ..
rm -rf app