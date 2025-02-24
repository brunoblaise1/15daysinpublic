import express from "express";
import arcjet, { shield } from "@arcjet/bun";
import { env } from "bun";
import http from "node:http";
import { streamData } from "./utils/streaming.ts";
import { getDaysLeaderboard, getdaysDetailForUser } from "./utils/slack.ts";

const app = express();
const port = 3000;

const aj = arcjet({
  key: env.ARCJET_KEY as string,
  rules: [shield({ mode: "LIVE" })],
});

// Middleware to set Content-Type and enable streaming
app.use((req, res, next) => {
  const userAgent = req.headers["user-agent"] as string;
  if (userAgent.includes("Firefox") || userAgent.includes("MSIE")) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", "inline"); // This will display content in browser
  } else {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  }
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  next();
});

// #daysinpublic leaderboard
app.get("/", async (req, res) => {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Too Many Requests" }));
    return;
  }
  const leaderboard = await getDaysLeaderboard(
    //you can set your leaderboard to any days
    new Date("2025-02-22"),
    new Date("2025-03-9"),
  );
  streamData(req, res, leaderboard);
});

app.get("/:user", async (req, res) => {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Too Many Requests" }));
    return;
  }

  const userDetail = await getdaysDetailForUser(
    decodeURIComponent(req.params.user),
  );

  streamData(req, res, userDetail);
});
const logger = (req: express.Request, res: express.Response) => {
  console.log(
    `\x1b[36m[${new Date().toISOString()}]\x1b[0m ${req.method}:${req.url} ${res.statusCode} ${req.headers["user-agent"]}`,
  );
};
// Create server
const server = http.createServer(app);
server.on("request", logger);

// Start server
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log(`Visit http://localhost:${port}`);
});
