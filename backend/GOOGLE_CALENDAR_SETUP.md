# Google Calendar / Meet setup — doctor appointments

This gives the Wish2Care backend a Google account it can use to auto-create a
Calendar event (with a real Google Meet link) every time a student books a
doctor appointment, and to email both the student and the doctor a calendar
invite. Do this once, under a **dedicated Wish2Care Google account** — not
anyone's personal account.

If a previous test run of this exists under someone's personal account, this
new one replaces it. The backend keeps working with no Meet links until the
new credentials are in place — nothing breaks in the meantime.

## 0. Create the dedicated account

Create a fresh Google account just for this, e.g.
`appointments@wish2care.org` or `wish2care.appointments@gmail.com` — whatever
the team wants to use long-term. Stay logged into **this** account for every
step below.

## 1. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Top-left project dropdown → **New Project**
3. Name it (e.g. "Wish2Care Appointments") → **Create**
4. Make sure the new project is selected in that same dropdown before continuing

## 2. Enable the Calendar API

1. Left sidebar → **APIs & Services → Library**
2. Search "Google Calendar API" → open it → **Enable**

## 3. Configure OAuth consent (Google calls this "Google Auth Platform")

You'll see sections in the left sidebar: **Overview, Branding, Audience,
Clients, Data access, Verification centre, Settings**.

1. **Audience**
   - User type: **External**
   - Scroll to **Test users** → **Add users** → enter the dedicated account's
     own email address → **Save**
2. **Data access**
   - **Add or remove scopes** → search "Calendar"
   - Check the scope for `.../auth/calendar.events` (the read/write one, not
     the read-only one)
   - **Update** → **Save**
3. **Branding**
   - Confirm an app name and support email are filled in (e.g. "Wish2Care
     Appointments" and the dedicated account's email). Google usually
     pre-fills this — just double check it looks right.

Leave everything in **Testing** mode — do not click "Publish app." Since only
one account (the dedicated one, added as a test user above) ever needs
access, Google's verification review isn't required.

## 4. Create the OAuth Client credentials

1. Left sidebar → **Clients** → **Create OAuth client**
2. Application type: **Web application** ← must be this, not "Desktop"
3. Name: anything, e.g. "Wish2Care Backend"
4. **Authorized redirect URIs** → **Add URI** → paste exactly:
   ```
   http://localhost:4321/oauth2callback
   ```
5. **Create**

A popup shows a **Client ID** and **Client Secret** (also downloadable as a
JSON file). **Send both values back** to whoever is wiring this into the
backend.

## 5. What happens next (not your job — just so you know)

Whoever receives the Client ID/Secret will:
1. Put them in the backend's `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
2. Run `npm run google:oauth-setup --workspace=backend`, which prints a
   Google sign-in link
3. **Sign into that link with this same dedicated account** (important — the
   account that completes this sign-in is the one whose Calendar actually
   hosts every future appointment event)
4. The script prints a refresh token to paste into `.env` as
   `GOOGLE_REFRESH_TOKEN` — after that, everything is automatic and this
   account never needs to sign in again

If the person doing step 5.3 isn't you, you'll need to either complete that
one sign-in yourself (fastest — just open the link they send you and click
Allow), or temporarily share the dedicated account's password so they can.

## Notes

- Nothing here costs money — Calendar API and Meet are free for 1-on-1 calls
  on a personal Gmail account. The only limit on the free tier is a 60-minute
  cap on **group** calls (3+ people), which doesn't apply to a doctor +
  student call.
- If this ever needs redoing (lost credentials, account change), repeat from
  step 1 — the old Client ID/Secret can just be deleted from **Clients**
  afterward.
