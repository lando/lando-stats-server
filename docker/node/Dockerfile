FROM kalabox/debian:stable

RUN apt-get update && \
    apt-get install curl && \
    curl -sL https://deb.nodesource.com/setup | bash - && \
    apt-get install -y nodejs

RUN chmod +x /usr/bin/node

VOLUME /code

ADD ./start-server.sh /start-server.sh

EXPOSE 80

ENTRYPOINT ["/usr/bin/node"]
