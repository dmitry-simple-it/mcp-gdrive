// Temporary one-off script: OAuth re-auth for gdrive MCP under a specific Google account.
// Unlike auth.ts (which uses @google-cloud/local-auth and auto-opens the DEFAULT browser),
// this script prints the auth URL instead of opening any browser, so the operator can open it
// manually in the correct Chrome profile (needed when the target account differs from the
// OS default browser's logged-in account).
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import http from "http";
import { URL } from "url";

const CREDS_DIR =
  process.env.GDRIVE_CREDS_DIR ||
  path.join(process.env.HOME || "", ".config", "mcp-gdrive");

const keyfilePath = path.join(CREDS_DIR, "gcp-oauth.keys.json");
const credentialsPath = path.join(CREDS_DIR, ".gdrive-server-credentials.json");

const keys = JSON.parse(fs.readFileSync(keyfilePath, "utf-8"));
const keyData = keys.installed || keys.web;

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== "/") {
      res.end("Invalid callback URL");
      return;
    }
    const searchParams = url.searchParams;
    if (searchParams.has("error")) {
      res.end(`Authorization rejected: ${searchParams.get("error")}`);
      console.error("AUTH_ERROR:", searchParams.get("error"));
      server.destroy?.();
      process.exit(1);
      return;
    }
    if (!searchParams.has("code")) {
      res.end("No authentication code provided.");
      return;
    }
    const code = searchParams.get("code");
    const redirectUri = `http://localhost:${server.address().port}`;
    const client = new google.auth.OAuth2(keyData.client_id, keyData.client_secret, redirectUri);
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    fs.writeFileSync(credentialsPath, JSON.stringify(tokens, null, 2));
    res.end("Authentication successful! You can close this tab and return to the console.");
    console.log("AUTH_SUCCESS");
    console.log("SCOPES:", tokens.scope);
    console.log("HAS_REFRESH_TOKEN:", !!tokens.refresh_token);
    setTimeout(() => process.exit(0), 500);
  } catch (e) {
    console.error("AUTH_EXCEPTION:", e && e.message ? e.message : e);
    res.end("Error during authentication, see server logs.");
    setTimeout(() => process.exit(1), 500);
  }
});

server.listen(0, () => {
  const port = server.address().port;
  const redirectUri = `http://localhost:${port}`;
  const client = new google.auth.OAuth2(keyData.client_id, keyData.client_secret, redirectUri);
  const authorizeUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES.join(" "),
  });
  console.log("REDIRECT_URI:", redirectUri);
  console.log("AUTH_URL_START");
  console.log(authorizeUrl);
  console.log("AUTH_URL_END");
});

// Safety timeout: give up after 5 minutes if nobody completes the flow.
setTimeout(() => {
  console.error("AUTH_TIMEOUT: no callback received within 5 minutes");
  process.exit(2);
}, 5 * 60 * 1000);
