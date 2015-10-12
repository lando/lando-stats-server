#!/bin/bash

/usr/bin/node /code/download.js > /code/data.txt && /usr/bin/node /code/report.js -d 7 --email < /code/data.txt
