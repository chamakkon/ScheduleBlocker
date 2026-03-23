import { net } from "electron/main";
import {
  getSlackBotToken,
  setSlackBotToken,
  clearSlackBotToken
} from "./credential-store";

async function slackFetch(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: Buffer | string;
  } = {}
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const req = net.request({
      method: options.method ?? "POST",
      url
    });

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        req.setHeader(key, value);
      }
    }

    let body = "";
    req.on("response", (response) => {
      response.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      response.on("end", () => {
        try {
          const data = JSON.parse(body) as Record<string, unknown>;
          resolve({ ok: data.ok === true, data });
        } catch {
          resolve({ ok: false, data: { error: "invalid_json" } });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

export async function connectSlack(botToken: string): Promise<void> {
  const result = await slackFetch("https://slack.com/api/auth.test", {
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!result.ok) {
    throw new Error(`Slack auth failed: ${result.data.error ?? "unknown"}`);
  }

  await setSlackBotToken(botToken);
}

export async function disconnectSlack(): Promise<void> {
  await clearSlackBotToken();
}

export async function shareTimelineImage(payload: {
  dataUrl: string;
  date: string;
  channelId?: string;
  initialComment?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const botToken = await getSlackBotToken();
  if (!botToken) throw new Error("Slack not connected");

  const base64 = payload.dataUrl.replace(/^data:image\/png;base64,/, "");
  const fileBuffer = Buffer.from(base64, "base64");
  const fileName = `daily-plan-${payload.date}.png`;

  // Step 1: get upload URL
  const uploadUrlRes = await slackFetch(
    `https://slack.com/api/files.getUploadURLExternal?filename=${encodeURIComponent(fileName)}&length=${fileBuffer.length}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${botToken}` }
    }
  );

  if (!uploadUrlRes.ok) {
    return { ok: false, error: String(uploadUrlRes.data.error ?? "getUploadURL failed") };
  }

  const uploadUrl = uploadUrlRes.data.upload_url as string;
  const fileId = uploadUrlRes.data.file_id as string;

  // Step 2: upload binary to the URL
  await new Promise<void>((resolve, reject) => {
    const req = net.request({ method: "POST", url: uploadUrl });
    req.setHeader("Content-Type", "application/octet-stream");
    req.on("response", (res) => {
      res.on("data", () => {});
      res.on("end", () => resolve());
    });
    req.on("error", reject);
    req.write(fileBuffer);
    req.end();
  });

  // Step 3: complete upload
  const completeBody = JSON.stringify({
    files: [{ id: fileId, title: `Daily Plan ${payload.date}` }],
    channel_id: payload.channelId,
    initial_comment: payload.initialComment ?? "今日のスケジュールです"
  });

  const completeRes = await slackFetch(
    "https://slack.com/api/files.completeUploadExternal",
    {
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json"
      },
      body: completeBody
    }
  );

  if (!completeRes.ok) {
    return { ok: false, error: String(completeRes.data.error ?? "completeUpload failed") };
  }

  return { ok: true };
}
