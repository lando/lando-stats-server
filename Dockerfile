FROM kalabox/debian:stable

RUN apt-get update && \
    apt-get install curl && \
    curl -sL https://deb.nodesource.com/setup | bash - && \
    apt-get install -y nodejs

RUN chmod +x /usr/bin/node

RUN mkdir /src

ADD ./* /src/

RUN cd /src && npm install

EXPOSE 80

CMD ["/usr/bin/node", "/src/server.js"]
