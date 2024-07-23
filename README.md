```
deno task start
```
dev
```
deno run --unstable --allow-net --allow-read --watch main.ts
```
prod
```
deno run --unstable --allow-net --allow-read main.ts
```


const SHARED_SECRET_KEY = env["SHARED_SECRET_KEY"];
