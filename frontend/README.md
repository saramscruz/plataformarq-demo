# Premium Auto Analysis — Signal Intelligence Platform

Automated signal collection and AI-powered analysis for the 12-week premium automotive digital ownership research project (May 22 – August 15, 2026).

## What it does

- **Collects signals** from 6 sources: Google Alerts, App Store, LinkedIn, Official Pages, Changelogs, Sales Pages
- **AI categorization** via Claude API: signal type (A-E), ownership narrative element, confidence level, limitation, content angles
- **Review interface**: approve/skip/mark-duplicate with editable AI suggestions before syncing to Google Sheets
- **Self-monitoring**: 15 built-in health checks across data collection, AI quality, data quality, and sync reliability
- **Weekly analytics**: auto-generated patterns, cross-brand analysis, and content angle suggestions

## Quick Start (Local)

```bash
cd frontend
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY and other keys in .env.local

npm install --legacy-peer-deps
npm run db:seed     # Load demo data
npm run dev         # http://localhost:3000
```

The app runs fully in demo mode without any API keys — you'll get mock AI suggestions and realistic seed data.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Optional | Real Claude AI suggestions (mock used if missing) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Optional | Sync approved signals to Google Sheets |
| `GOOGLE_SHEETS_SIGNAL_LOG_ID` | Optional | Target sheet ID for sync |
| `GMAIL_APP_PASSWORD` | Optional | IMAP access for Google Alerts parsing |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth login |
| `NEXTAUTH_SECRET` | Recommended | Session encryption (generate with `openssl rand -base64 32`) |

**Without any keys:** App runs in demo mode — all features work with mock data and heuristic AI.

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── dashboard/          # Health Dashboard (main view)
│   │   ├── inbox/              # Pending signals inbox
│   │   ├── signal/[id]/        # Signal review + edit interface
│   │   ├── analytics/          # Weekly analytics + patterns
│   │   ├── config/             # User configuration
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # NavBar, StatusDot
│   │   └── signals/            # SignalCard, SignalReviewForm
│   └── lib/
│       ├── db/                 # SQLite schema, queries, seed data
│       ├── ai/                 # Claude API categorization + pattern detection
│       ├── collectors/         # Data collection (mock + real interfaces)
│       ├── health/             # 15 health check implementations
│       ├── sheets/             # Google Sheets sync
│       └── types.ts            # All TypeScript types
```

## Daily Workflow (5-10 minutes)

1. Open `/dashboard` — check system health (all 🟢? Carry on)
2. Open `/inbox` — review pending signals
3. For each signal: verify AI suggestions, edit if needed, click **Approve**
4. Signal syncs to Google Sheets automatically

## Weekly Workflow (Friday)

1. Open `/analytics` — review weekly summary
2. Check patterns detected by AI
3. Choose content angles for Mon/Thu/Sun posts

## Implementing Real Data Sources

Each collector in `src/lib/collectors/index.ts` has a `// REPLACE WITH REAL IMPL` comment:

- **Google Alerts**: Connect via `imap-simple` to Gmail IMAP, parse `googlealerts-noreply@google.com` emails
- **App Store**: Scrape Google Play Store pages with `cheerio`, compare version strings
- **LinkedIn**: Use LinkedIn API or scraping (check ToS), monitor official company pages
- **Official Pages**: `cheerio` scrape + diff detection against stored snapshots

## Health Monitoring

The system monitors itself across 15 checks:

| Category | Checks |
|----------|--------|
| Data Collection | Google Alerts arrival, App Store, LinkedIn, Official Pages, Scraper health |
| AI Quality | Signal type accuracy, Narrative element accuracy, Limitation quality, Confidence calibration |
| Data Quality | Excerpt accuracy sampler, URL validity, Duplication rate |
| Sync | Google Sheets sync reliability + latency |
| Analytics | Analytics accuracy validator, Pattern verification |

View all at `/dashboard`.

## Deployment

**Vercel (recommended):**
```bash
cd frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard.

**Docker:**
```bash
docker-compose up  # from repo root
```

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Database**: SQLite (better-sqlite3) for local/single-user; swap `DATABASE_FILE` for Postgres path
- **AI**: Anthropic SDK, claude-sonnet-4-6
- **Auth**: next-auth with Google OAuth
