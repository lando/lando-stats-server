FROM kalabox/debian:stable

RUN apt-get update && \
    apt-get install curl && \
    curl -sL https://deb.nodesource.com/setup | bash - && \
    apt-get install -y nodejs

RUN chmod +x /usr/bin/node

VOLUME /code

EXPOSE 80

CMD [
  "/usr/bin/node", "/code/download.js",
  "|", "/usr/bin/node", "/code/report.js", "-d", "14"
]
