FROM kalabox/debian:stable
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10

RUN apt-get update
RUN apt-get install -y lsb-release

RUN echo "deb http://repo.mongodb.org/apt/debian "$(lsb_release -sc)"/mongodb-org/3.0 main" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list

RUN apt-get update && \
    apt-get install -y mongodb-org

#RUN mkdir -p /sql/

VOLUME /sql

EXPOSE 27017

CMD ["mongod", "--dbpath", "/sql"]
