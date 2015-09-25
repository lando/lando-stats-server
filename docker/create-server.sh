#!/bin/bash

CODE_DIR=$1
echo $CODE_DIR

docker stop web2
docker rm web2

docker run \
  -d \
  --name web2 \
  -p 80:81 \
  --link db2:db2 \
  -v $CODE_DIR:/code \
  kalabox/stats-node:v2 \
  /code/server.js
