import express from "express";
import arcjet, { createRemoteClient, defaultBaseUrl } from "@arcjet/node";
import { createConnectTransport } from "@connectrpc/connect-web";
import http from "http";
import { streamData } from "./utils/streaming.ts";
import { getDaysLeaderboard, getdaysDetailForUser } from "./utils/slack.ts";

const app = express();
const port = 3000;

const transport = createConnectTransport({
  baseUrl: defaultBaseUrl(),
  fetch,
});

const client = createRemoteClient({
  transport,
  baseUrl: defaultBaseUrl(),
  timeout: 500,
});

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [],
  client,
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
    new Date("2025-02-15"),
    new Date("2025-02-30"),
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

// Create server
const server = http.createServer(app);

// Start server
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log(`Visit http://localhost:${port}`);
});
