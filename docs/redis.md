
Prerequisites:
* Install docker and verify it with:
```
docker --version
```

Once docker is running on your desktop, run:
```
docker run --name redis-dev -p 6379:6379 redis
```
* (If not already downloaded) Pulls the Redis image 
* Creates a new container
* Starts the Redis process inside it
* Maps port 6379 (container → your machine)

You should see something like this after running `docker ps`:
```
>docker ps

CONTAINER ID   IMAGE     COMMAND                  CREATED       STATUS       PORTS                                         NAMES
021e4307d898   redis     "docker-entrypoint.s…"   2 hours ago   Up 2 hours   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp   redis-dev
```

To enter docker container, run:
```
docker exec -it redis-dev redis-cli
```
* Enters an already running container
* Runs a command inside it (`redis-cli`)
* Attaches your terminal to it (`-it`)

Inside the container, you can run redis commands like:
```
127.0.0.1:6379> SET hello world
OK
127.0.0.1:6379> GET hello
"world"
```