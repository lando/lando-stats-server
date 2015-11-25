#!/bin/bash

DAYS=$1

/usr/bin/node /code/download.js > /code/data.txt && /usr/bin/node /code/report.js -d $DAYS --email < /code/data.txt
