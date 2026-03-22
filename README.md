# PQC Readiness Tracker — Frontend

Post-quantum cryptographic readiness and TLS posture monitoring platform.
Dual-surface: public intelligence layer + internal admin console.

---

## Tech Stack

- **React 18** + **Vite 5**
- **Tailwind CSS 3**
- **React Router v6**
- **IBM Plex Mono** (design identity font)
- No TypeScript, no heavy state management library

---

## Project Structure

```
src/
├── App.jsx                        # Root router
├── main.jsx                       # Entry point
├── index.css                      # Global styles + design system
├── lib/
│   ├── api.js                     # All API calls + gap documentation
│   └── utils.js                   # Formatters, constants (COUNTRIES, SECTORS)
├── hooks/
│   └── useApi.js                  # useApi + useApiMutation hooks
├── components/
│   ├── shared/
│   │   └── UI.jsx                 # All shared primitives (Modal, Drawer, Badges, etc.)
│   └── public/
│       └── PublicNav.jsx          # Public navigation header
├── layouts/
│   ├── PublicLayout.jsx           # Public shell (nav + footer + outlet)
│   └── AdminLayout.jsx            # Admin shell (collapsible sidebar + outlet)
└── pages/
    ├── public/
    │   ├── HomePage.jsx           # Landing / hero
    │   ├── TestDomainPage.jsx     # Domain analysis tool
    │   ├── ExplorePage.jsx        # Filterable domain explorer
    │   ├── SubmitDomainPage.jsx   # Public domain submission form
    │   └── DomainDetailPage.jsx   # Public domain profile
    └── admin/
        ├── DashboardPage.jsx      # Operations control room
        ├── DomainsPage.jsx        # Domain CRUD
        ├── TestTypesPage.jsx      # Test type management
        ├── DomainTestsPage.jsx    # Domain-test assignments + Run Now
        └── RunsPage.jsx           # Execution history + detail drawer
```

---

## Routes

| Path | Surface | Description |
|------|---------|-------------|
| `/` | Public | Home / landing |
| `/test` | Public | Test a domain |
| `/explore` | Public | Domain explorer |
| `/submit` | Public | Submit a domain |
| `/domain/:id` | Public | Domain detail profile |
| `/admin` | Admin | Dashboard |
| `/admin/domains` | Admin | Domains management |
| `/admin/test-types` | Admin | Test types |
| `/admin/domain-tests` | Admin | Domain test assignments + run control |
| `/admin/runs` | Admin | Execution history |

---

## Setup & Development

### Prerequisites
- Node.js 18+
- npm

### Install

```bash
npm install
```

### Configure

Copy `.env` and adjust if needed:

```bash
cp .env .env.local
# Edit VITE_API_BASE_URL if pointing at a different backend
```

Default: `https://pqc-readiness-tracker-production.up.railway.app`

### Run locally

```bash
npm run dev
```

Opens at `http://localhost:5173`

---

## Build & Deploy

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host:

### Vercel
```bash
npx vercel --prod
```

### Netlify
```bash
npx netlify deploy --prod --dir=dist
```

### Railway (static)
Set build command: `npm run build`
Set publish directory: `dist`

### Nginx / self-hosted
Copy `dist/` to your webroot.
Configure a catch-all redirect to `index.html` for SPA routing:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `https://pqc-readiness-tracker-production.up.railway.app` | Backend API base URL |

---

## Known API Gaps

These features need new backend endpoints to be fully functional:

| Feature | Gap | Suggested Endpoint |
|---------|-----|-------------------|
| Anonymous domain testing | No public test endpoint | `POST /public/test { domain }` → run result |
| Public domain listing (filtered) | All domains endpoint includes admin data | `GET /public/domains?country=&sector=&active=true` |
| Domain-scoped run history | Requires cross-joining client-side | `GET /domains/:id/runs` |
| Platform stats | Multiple round-trips needed | `GET /stats` → `{ domains, runs, testTypes, ... }` |
| Admin moderation queue | Submitted domains go live immediately | `GET /admin/pending-domains` |

The frontend is structured to wire these in cleanly — each gap has a comment in `src/lib/api.js`.

---

## Design System

The UI uses a terminal-cybersecurity aesthetic:

- **Font**: IBM Plex Mono throughout (monospace identity)
- **Background**: `#050810` (near-void black)
- **Accent**: `#00d4ff` (electric cyan)
- **Signal/pass**: `#39ff14` (neon green)
- **Warn**: `#ff6b35` (amber)
- **Critical**: `#ff2d55` (alert red)
- Grid overlay, scanline animation, glows on interactive elements

Public surface: spacious, editorial, credible.
Admin surface: dense, tabular, operational.

All design tokens are in `src/index.css` and `tailwind.config.js`.
