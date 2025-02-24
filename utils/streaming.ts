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

  const chars = splitter.splitGraphemes(body);
  const speedMultipliers = Math.exp(-chars.length / 1000) + 0.1;

  let delay = 0;

  // Send the body in chunks by letter with a variable delay
  const speeds: Record<string, number> = {
    "🐢": 45,
    "🐇": 5 * speedMultipliers,
    "🚀": 1 * speedMultipliers,
  };

  for (const char of chars) {
    if (char in speeds) {
      speed = speeds[char];
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
