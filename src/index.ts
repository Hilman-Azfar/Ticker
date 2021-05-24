const Koa = require("koa");
const { PassThrough } = require("stream");
const app = new Koa();
const EventEmitter = require("events");
const { Transform } = require("stream");

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
  events.emit("data", { timestamp: new Date() });
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
    stream.write(`data: ${data}\n\n`);
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

app.listen(5000, () => console.log("Listening"));``