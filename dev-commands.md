# Commands and stuff

## Docker compose

To build and run a container as specified in docker-compose file

```shell
docker compose up -d
```

To see logs from the composed containers

```shell
docker compose logs -f
```

To shut down the containers in compose

```shell
docker compose down
```

Build only

```shell
docker compose build
```

Check health

```shell
docker compose ps
```

## Volume setup

Make sure your data directory exists:

```shell
mkdir -p data
chmod 755 data
```

## Verification

After running `docker compose up -d`:

1. check it's running: `docker compose ps`
2. test health: `curl http://127.0.0.1:3010/health`
3. check logs: `docker compose logs`
