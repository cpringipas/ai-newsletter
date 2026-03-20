# AI Newsletter System

Automated Greek AI newsletter for small business owners, entrepreneurs, and teachers.

## Features

- Collects AI news from RSS feeds and custom sources
- Deduplicates and ranks articles
- Summarizes stories in simple Greek
- Generates one daily newsletter with practical usage ideas
- Stores subscribers, sources, articles, and issues in SQLite
- Sends emails with SMTP or Resend
- Includes referral links and share mechanics
- Tracks opens and clicks per issue
- Includes landing page, archive, and admin controls
- Runs automatically on a daily schedule

## Stack

- Backend: Node.js + Express
- Views: EJS + custom CSS
- Database: SQLite
- Email: SMTP or Resend
- AI: OpenAI API with deterministic fallback when no key is set

## Local setup

1. Create the project env file.

```bash
copy .env.example .env
```

2. Edit `.env` and set at least:

- `ADMIN_TOKEN`
- `DEFAULT_FROM_EMAIL`
- Email credentials for either SMTP or Resend
- `OPENAI_API_KEY` if you want AI-generated Greek summaries instead of the local fallback

3. Install dependencies.

```bash
npm.cmd install
```

4. Start the app.

```bash
npm.cmd run dev
```

5. Open:

- Landing page: `http://localhost:3000`
- Admin page: `http://localhost:3000/admin?token=YOUR_ADMIN_TOKEN`

## Daily automation flow

The app schedules a cron job when the server starts:

1. Fetch RSS items from active sources
2. Deduplicate and rank them
3. Summarize the top stories in Greek
4. Build the daily newsletter issue
5. Email the issue to all active subscribers

You can also trigger this manually:

```bash
npm.cmd run newsletter:run
```

## Admin actions

From `/admin?token=...` you can:

- Add new RSS sources
- Enable or disable sources
- Preview the next issue
- Generate and send the daily issue manually
- Send the latest generated issue again
- See open-rate, click, and referral stats for the latest issue

## Deployment

### Option 1: VPS or small server

1. Install Node.js 20+.
2. Copy the project files.
3. Run `npm.cmd install` on Windows or `npm install` on Linux.
4. Create `.env`.
5. Start with PM2 or systemd.

Example with PM2:

```bash
npm install
npm run db:init
pm2 start src/server.js --name ai-newsletter
pm2 save
```

The internal cron scheduler will run automatically while the app process is alive.

### Option 2: Render / Railway / Fly.io

- Use a persistent disk or switch to PostgreSQL if your platform does not support persistent local storage.
- Set all environment variables in the provider dashboard.
- Start command: `npm run start`

## Notes

- SQLite is ideal for the first version and easy deployment.
- If you expect larger scale, move to PostgreSQL and a queue worker.
- The built-in AI fallback keeps the system usable without an API key, but OpenAI gives far better Greek output.
