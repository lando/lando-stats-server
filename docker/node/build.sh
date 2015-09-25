#!/bin/bash
set -e

docker build --tag kalabox/stats-node:v2 ./
docker push kalabox/stats-node:v2
