## Testing

1. Build the image locally:

docker build -t kalabox/metrics-rest .

2. Create environmental variables to hook it up to Bugsnag and Elasticsearch
instances by saving a file "env" with credentials:

```
KALABOX_METRICS_ELASTIC={"host":"INSERT HOSET","index":"INDXE","type":"action"}
KALABOX_METRICS_BUGSNAG={"apiKey":"APIKEY"}
KALABOX_METRICS_PORT=80
```

3. Run the container:

`docker run -p 8080:80 --env-file=env kalabox/metrics-rest`

4. Run some test queries/insert test entries:

localhost:8080/status

