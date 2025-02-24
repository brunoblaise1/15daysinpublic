interface post {
  timestamp: Date;
  content: string;
}

interface user {
  user: string;
  posts: post[];
}

// Function to generate the leaderboard table
function generateLeaderboardTable(users: user[]): string {
  const uniqueTimestamps = Array.from(
    new Set(
      users.flatMap((u) =>
        u.posts.map((p) => p.timestamp.toISOString().split("T")[0]),
      ),
    ),
  ).sort();

  // Calculate the maximum username length
  const maxUsernameLength = Math.max(...users.map((user) => user.user.length));

  // Calculate the length of each date
  const dateLengths = uniqueTimestamps.map(
    (timestamp, index) => timestamp.length,
  );

  const headerRow = `| User${" ".repeat(maxUsernameLength - 4)} |${uniqueTimestamps.map((timestamp, index) => ` ${timestamp} `).join("|")}|`;
  const separatorRow = `|${"-".repeat(maxUsernameLength + 2)}|${dateLengths.map((length) => "-".repeat(length + 2)).join("|")}|`;

  const bodyRows = users.map((user) => {
    const postsByDate = new Set(
      user.posts.map((post) => post.timestamp.toISOString().split("T")[0]),
    );

    const userCell = ` ${user.user}${" ".repeat(maxUsernameLength - user.user.length)} `;
    const cells = uniqueTimestamps.map((timestamp, index) => {
      const date = user.posts.filter(
        (post) => post.timestamp.toISOString().split("T")[0] === timestamp,
      );

      return date[0]
        ? `${date.length > 1 ? `${date.length}` : "✓"} ${date[0].timestamp.getUTCHours()}:${date[0].timestamp.getUTCMinutes()}:${date[0].timestamp.getUTCSeconds()}`.padEnd(
            dateLengths[index] + 2,
          )
        : " ".repeat(dateLengths[index] + 2);
    });

    return `|${userCell}|${cells.join("|")}|`;
  });

  return [
    separatorRow,
    headerRow,
    separatorRow,
    ...bodyRows,
    separatorRow,
  ].join("\n");
}
export async function getDaysLeaderboard(start: Date, end: Date) {
  const users: user[] = [];

  const response = await fetch(
    "https://scrapbook.hackclub.com/api/r/10daysinpublic", //this is reaction for 10days staying the same for fetching it
  );

  interface Post {
    timestamp: number;
    text: string;
    user: {
      username: string;
      timezoneOffset: number;
    };
  }

  const posts = (await response.json()) as Post[];

  for (const post of posts) {
    const timestampAdjusted = new Date();
    timestampAdjusted.setTime(
      (post.timestamp + post.user.timezoneOffset) * 1000,
    );

    if (
      timestampAdjusted.getTime() < start.getTime() ||
      timestampAdjusted.getTime() > end.getTime()
    ) {
      continue;
    }

    // add user to the list if they don't exist
    // otherwise, add the post to the user's posts
    const userIndex = users.findIndex((u) => u.user === post.user.username);
    if (userIndex === -1) {
      users.push({
        user: post.user.username,
        posts: [{ timestamp: timestampAdjusted, content: post.text }],
      });
    } else {
      users[userIndex].posts.push({
        timestamp: timestampAdjusted,
        content: post.text,
      });
    }
  }
  // display the leaderboard in markdown format
  if (users.length === 0) {
    return `# 15 Days in Public Leaderboard from ${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}\n\nGood Luck and have fun!\nTime next to the checkmarks is given in h:m:s local time for that user🚀\nYou can find out specific details per user by going to https://daysinpublic.blaisee.me/userid\n\nNo data yet post something to appear here on slack and react with emoji of 10daysinpublic\n`;
  }

  return `# 15 Days in Public Leaderboard from ${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}\n\nGood Luck and have fun!\nTime next to the checkmarks is given in h:m:s local time for that user🚀\nYou can find out specific details per user by going to https://daysinpublic.blaisee.me/userid\n\n${generateLeaderboardTable(users)}\n`;
}

export async function getdaysDetailForUser(user: string) {
  interface Post {
    timestamp: number;
    text: string;
    user: {
      username: string;
      timezoneOffset: number;
    };
  }

  const response = await fetch(
    "https://scrapbook.hackclub.com/api/r/10daysinpublic",
  );
  const data = (await response.json()) as Post[];

  const posts = data
    .filter((post) => post.user.username.toLowerCase() === user.toLowerCase())
    .sort((a, b) => a.timestamp - b.timestamp);

  return posts.length > 0
    ? `# ${user}\n${posts
        .map((post) => {
          const timestampAdjusted = new Date();
          timestampAdjusted.setTime(
            (post.timestamp + post.user.timezoneOffset) * 1000,
          );

          return `\n---\n${timestampAdjusted.toISOString().split("T")[0]} at ${timestampAdjusted.getUTCHours()}:${timestampAdjusted.getUTCMinutes()}:${timestampAdjusted.getUTCSeconds()} - ${post.text}`;
        })
        .join("")}\n---\n`
    : "No posts found for this user\n";
}

interface Post {
  timestamp: Date;
  content: string;
}

export async function getJsonLeaderboard(): Promise<
  { user: string; posts: { timestamp: number; content: string }[] }[]
> {
  const response = await fetch(
    "https://scrapbook.hackclub.com/api/r/10daysinpublic",
  );
  interface Post {
    timestamp: number;
    text: string;
    user: {
      username: string;
      timezoneOffset: number;
    };
  }
  const data = (await response.json()) as Post[];

  const users: { [key: string]: { timestamp: number; content: string }[] } = {};

  for (const post of data) {
    const timestampAdjusted = new Date();
    timestampAdjusted.setTime(
      (post.timestamp + post.user.timezoneOffset) * 1000,
    );

    if (!users[post.user.username]) {
      users[post.user.username] = [];
    }

    users[post.user.username].push({
      timestamp: timestampAdjusted.getTime(),
      content: post.text,
    });
  }

  return Object.entries(users).map(([username, posts]) => ({
    user: username,
    posts: posts,
  }));
}
