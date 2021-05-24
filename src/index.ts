const Koa = require("koa");
const { PassThrough } = require("stream");
const app = new Koa();
const EventEmitter = require("events");
const { Transform } = require("stream");
const os = require("os");

class SSEStream extends Transform {
  constructor() {
    super({
      writableObjectMode: true,
    });
  }

  _transform(data, _encoding, done) {
    this.push(`data: ${JSON.stringify(data)}\n\n`);
    done();
  }
}

const events = new EventEmitter();
events.setMaxListeners(0);

const interval = setInterval(() => {
  events.emit("data", {
    hostname: os.hostname(),
    type: os.type(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    time: new Date()
  });
}, 1000);


// logger

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// github hook

app.use(async (ctx, next) => {
  if (ctx.path !== "/webhook/push") {
    return await next();
  }
  console.log("received hooks to rebuild");
  const exec = require("child_process").exec;

  exec('git pull --rebase', function(error, stdout, stderr) {
    console.log("git pullinggggggg!!!!!!");
    
    if (error) throw error;
    if (stderr) throw stderr;
  });

  ctx.status = 200;
  ctx.body = "ok";
});

// sse

app.use(async (ctx, next) => {
  if (ctx.path !== "/sse") {
    return await next();
  }

  console.log("sse open");

  ctx.request.socket.setTimeout(0);
  ctx.req.socket.setNoDelay(true);
  ctx.req.socket.setKeepAlive(true);

  ctx.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const stream = new SSEStream();

  ctx.status = 200;
  ctx.body = stream;

  const listener = (data) => {
    stream.write(data);
  }

  events.on("data", listener);

  stream.on("close", () => {
    events.off("data", listener);
    console.log("sse close");
    
  });
});

app.use(ctx => {
  ctx.status = 200;
  ctx.body = "ok";
});

app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

app.listen(5000, () => console.log("Listening"));``