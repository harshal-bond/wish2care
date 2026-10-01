/**
 * One-time setup script — run this once, locally, to get a Google refresh
 * token for the dedicated appointments Google account. Never part of the
 * running server; nothing here executes in production.
 *
 * Prerequisites (Google Cloud Console):
 * 1. Create a project, enable the "Google Calendar API".
 * 2. OAuth consent screen: External type, Testing mode, add the dedicated
 *    Gmail account as a Test User, scope `calendar.events`.
 * 3. Credentials -> Create OAuth Client ID -> type "Web application" ->
 *    Authorized redirect URI: http://localhost:4321/oauth2callback
 * 4. Put the resulting Client ID/Secret in your .env as GOOGLE_CLIENT_ID /
 *    GOOGLE_CLIENT_SECRET, then run: npm run google:oauth-setup --workspace=backend
 *
 * Log into the dedicated account (not your personal one) when the browser
 * opens. The refresh token this prints never expires unless manually
 * revoked — this is a one-time step.
 */
import 'dotenv/config';
import http from 'http';
import { google } from 'googleapis';

const PORT = 4321;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first (from Google Cloud Console -> Credentials).');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // required to receive a refresh_token
  prompt: 'consent', // forces a refresh_token even if this account authorized before
  scope: ['https://www.googleapis.com/auth/calendar.events'],
});

console.log('\n1. Confirm your OAuth Client has this exact Authorized redirect URI:');
console.log(`   ${REDIRECT_URI}\n`);
console.log('2. Open this URL, sign in with the DEDICATED appointments Google account, and click Allow:\n');
console.log(authUrl + '\n');
console.log('Waiting for sign-in to complete...\n');

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const code = new URL(req.url, REDIRECT_URI).searchParams.get('code');
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('No authorization code received — check the terminal and try again.');
    server.close();
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Done — you can close this tab and go back to your terminal.');
    server.close();

    if (!tokens.refresh_token) {
      console.warn(
        'No refresh_token came back. This usually means the account already granted access before.\n' +
          'Go to https://myaccount.google.com/permissions, remove access for this app, and run this script again.'
      );
      process.exit(1);
    }

    console.log('Success! Add these to your backend .env:\n');
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('GOOGLE_CALENDAR_ID=primary   # or a dedicated secondary calendar\'s ID\n');
    process.exit(0);
  } catch (err) {
    console.error('Token exchange failed:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Token exchange failed — check the terminal.');
    server.close();
    process.exit(1);
  }
});

server.listen(PORT);
