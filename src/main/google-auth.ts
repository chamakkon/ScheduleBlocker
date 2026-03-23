import http from "node:http";
import { URL } from "node:url";
import { shell } from "electron";
import { google } from "googleapis";
import {
  getGoogleRefreshToken,
  setGoogleRefreshToken,
  clearGoogleRefreshToken
} from "./credential-store";
import { loadSettings } from "./storage";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/tasks.readonly"
];

let cachedOAuth2: InstanceType<typeof google.auth.OAuth2> | null = null;

async function getClientCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
} | null> {
  const settings = await loadSettings();
  if (!settings.google?.clientId || !settings.google?.clientSecret) {
    return null;
  }
  return {
    clientId: settings.google.clientId,
    clientSecret: settings.google.clientSecret
  };
}

function createOAuth2WithRedirect(
  clientId: string,
  clientSecret: string,
  redirectUri: string
): InstanceType<typeof google.auth.OAuth2> {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function createOAuth2Client(
  redirectUri = "http://127.0.0.1"
): Promise<InstanceType<typeof google.auth.OAuth2> | null> {
  const creds = await getClientCredentials();
  if (!creds) return null;
  return createOAuth2WithRedirect(creds.clientId, creds.clientSecret, redirectUri);
}

export async function getAuthenticatedClient(): Promise<InstanceType<typeof google.auth.OAuth2> | null> {
  if (cachedOAuth2) return cachedOAuth2;

  const client = await createOAuth2Client();
  if (!client) return null;

  const refreshToken = await getGoogleRefreshToken();
  if (!refreshToken) return null;

  client.setCredentials({ refresh_token: refreshToken });

  client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      void setGoogleRefreshToken(tokens.refresh_token);
    }
  });

  cachedOAuth2 = client;
  return client;
}

export async function connectGoogle(): Promise<void> {
  const creds = await getClientCredentials();
  if (!creds) {
    throw new Error("Google OAuth credentials not configured. Set Client ID and Secret in Settings.");
  }

  const { code, redirectUri } = await openBrowserAndGetCode(creds.clientId, creds.clientSecret);
  const client = createOAuth2WithRedirect(creds.clientId, creds.clientSecret, redirectUri);
  const { tokens } = await client.getToken(code);

  if (tokens.refresh_token) {
    await setGoogleRefreshToken(tokens.refresh_token);
  }
  client.setCredentials(tokens);
  cachedOAuth2 = client;
}

export async function disconnectGoogle(): Promise<void> {
  if (cachedOAuth2) {
    try {
      await cachedOAuth2.revokeCredentials();
    } catch {
      // ignore revoke errors
    }
  }
  cachedOAuth2 = null;
  await clearGoogleRefreshToken();
}

export async function getGoogleStatus(): Promise<{
  connected: boolean;
  scopes: string[];
}> {
  const client = await getAuthenticatedClient();
  if (!client) return { connected: false, scopes: [] };

  try {
    const tokenInfo = await client.getAccessToken();
    return {
      connected: Boolean(tokenInfo.token),
      scopes: SCOPES
    };
  } catch {
    cachedOAuth2 = null;
    return { connected: false, scopes: [] };
  }
}

function openBrowserAndGetCode(
  clientId: string,
  clientSecret: string
): Promise<{ code: string; redirectUri: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    let resolved = false;

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to start local server"));
        return;
      }

      const redirectUri = `http://127.0.0.1:${addr.port}`;
      const oauthClient = createOAuth2WithRedirect(clientId, clientSecret, redirectUri);

      const authUrl = oauthClient.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
      });

      void shell.openExternal(authUrl);

      server.on("request", (req, res) => {
        if (resolved) {
          res.end("Already handled.");
          return;
        }

        const url = new URL(req.url ?? "/", `http://127.0.0.1`);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h3>Authorization denied. You can close this tab.</h3>");
          resolved = true;
          server.close();
          reject(new Error(`Google auth error: ${error}`));
          return;
        }

        if (code) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h3>Authorization successful! You can close this tab.</h3>");
          resolved = true;
          server.close();
          resolve({ code, redirectUri });
          return;
        }

        res.writeHead(400);
        res.end("Missing code parameter.");
      });
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        server.close();
        reject(new Error("Google OAuth timed out (120s)."));
      }
    }, 120_000);
  });
}
