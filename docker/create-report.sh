#!/bin/bash

CODE_DIR=$1
echo $CODE_DIR

docker rm report1

docker run \
 --name report1 \
 -v $CODE_DIR:/code \
 --entrypoint /bin/bash \
 kalabox/stats-node:v2 \
 /code/report.sh
