import type { Request, Response } from "express";

import GraphemeSplitter from "grapheme-splitter";

const splitter = new GraphemeSplitter();
let speed = 10;

const transmissionStart = `🐢---------------------
START OF TRANSMISSION
type: {contentType}
---------------------🐇

`;
const transmissionEnd = `
🐢-------------------
END OF TRANSMISSION
status: 200
wrote: {bytes} bytes
-------------------
`;

export function streamData(
  _req: Request,
  res: Response,
  message: string,
  contentType = "text/plain",
) {
  // get total bytes of message and replace {bytes} in transmissionEnd with the number of bytes of the message
  const body =
    transmissionStart.replace("{contentType}", contentType) +
    message +
    transmissionEnd.replace("{bytes}", Buffer.byteLength(message).toString());

  let delay = 0;

  // Send the body in chunks by letter with a variable delay
  for (const char of splitter.splitGraphemes(body)) {
    if (char === "🐢") {
      speed = 55;
    } else if (char === "🐇") {
      speed = 5;
    } else if (char === "🚀") {
      speed = 1;
    } else {
      delay += speed;
      setTimeout(() => {
        res.write(char);
      }, delay);
    }
  }

  // Close the connection after sending the last chunk
  setTimeout(() => {
    res.end();
  }, delay);
}
