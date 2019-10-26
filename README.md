# DEPRECATED!

This is no longer being used! We have moved the metrics server into the core lando repo.
See https://github.com/lando/lando/tree/master/metrics

Lando Metrics Server
====================

Lightweight node server that powers Lando metrics.

Local Development
-----------------

### Installing

Local development requires [lando](https://docs.lndo.io).

```bash
# Clone the site
git clone https://github.com/kalabox/lando-stats-server.git
cd lando-stats-server
lando npm install
```

### Configuration

You'll want to drop a `.env` file in the root of this repo with the relevant creds.

```bash
LANDO_METRICS_PORT=7000
LANDO_METRICS_TIMEOUT=100000
LANDO_METRICS_BUGSNAG={}
LANDO_METRICS_ELASTIC={}
```

### Running Site Locally

```
# Boot up with lando
lando start
```

Testing
-------

```bash
# Things
lando grunt test
```

Deploying
---------

Using [GitHub Flow](https://guides.github.com/introduction/flow/) push a branch to this project and open a pull request. If tests pass and the pull request is accepted the change is automatically deployed.

```bash
git checkout -b ISSUESNUMBER-ISSUEDESCRIPITON
git add -A
git commit -m "#ISSUENUMBER: COMMIT DESCRIPTION"
lando push origin ISSUESNUMBER-ISSUEDESCRIPITON
```
