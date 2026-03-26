import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { app, safeStorage } from "electron";

type StoredCredentials = {
  googleRefreshToken?: string;
  slackBotToken?: string;
};

const CREDENTIALS_FILE = "credentials.enc.json";

function getFilePath(): string {
  const dir = app.isPackaged
    ? app.getPath("userData")
    : path.join(process.cwd(), "data");
  return path.join(dir, CREDENTIALS_FILE);
}

function encrypt(value: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(value).toString("base64");
  }
  return safeStorage.encryptString(value).toString("base64");
}

function decrypt(encoded: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(encoded, "base64").toString("utf8");
  }
  return safeStorage.decryptString(Buffer.from(encoded, "base64"));
}

async function load(): Promise<StoredCredentials> {
  try {
    const raw = await readFile(getFilePath(), "utf8");
    return JSON.parse(raw) as StoredCredentials;
  } catch {
    return {};
  }
}

async function save(creds: StoredCredentials): Promise<void> {
  const dir = path.dirname(getFilePath());
  await mkdir(dir, { recursive: true });
  await writeFile(getFilePath(), JSON.stringify(creds, null, 2), "utf8");
}

export async function getGoogleRefreshToken(): Promise<string | null> {
  const creds = await load();
  if (!creds.googleRefreshToken) return null;
  try {
    return decrypt(creds.googleRefreshToken);
  } catch {
    return null;
  }
}

export async function setGoogleRefreshToken(token: string): Promise<void> {
  const creds = await load();
  creds.googleRefreshToken = encrypt(token);
  await save(creds);
}

export async function clearGoogleRefreshToken(): Promise<void> {
  const creds = await load();
  delete creds.googleRefreshToken;
  await save(creds);
}

export async function getSlackBotToken(): Promise<string | null> {
  const creds = await load();
  if (!creds.slackBotToken) return null;
  try {
    return decrypt(creds.slackBotToken);
  } catch {
    return null;
  }
}

export async function setSlackBotToken(token: string): Promise<void> {
  const creds = await load();
  creds.slackBotToken = encrypt(token);
  await save(creds);
}

export async function clearSlackBotToken(): Promise<void> {
  const creds = await load();
  delete creds.slackBotToken;
  await save(creds);
}
