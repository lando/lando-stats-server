#!/bin/bash
set -e

docker build --tag kalabox/stats-mongo:v2 ./
docker push kalabox/stats-mongo:v2
