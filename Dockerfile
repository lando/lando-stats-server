FROM kalabox/debian:stable

RUN apt-get update && \
    apt-get install curl && \
    curl -sL https://deb.nodesource.com/setup | bash - && \
    apt-get install -y nodejs

RUN chmod +x /usr/bin/node

EXPOSE 80

CMD ["/usr/bin/node", "server.js"]
