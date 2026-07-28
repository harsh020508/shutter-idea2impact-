# Shutter

A B2B retail SaaS platform for Indian kirana stores. Shutter helps small retailers manage inventory, generate QR bills, get AI-powered insights, trade surplus stock with nearby stores, and visualize demand heatmaps.

## Features

- **Inventory Management** - Track stock levels, set low-stock alerts, flag surplus or dead stock, and view AI-powered restock recommendations
- **QR Billing** - Generate itemized bills with GST calculations, scan barcodes, and accept multiple payment methods (cash, UPI, card)
- **Genie AI Assistant** - Ask natural language questions about your store and get context-aware advice powered by Gemini, with local demand signals injected into responses
- **Trade Matching** - Match surplus stock with nearby retailers who need those products; view distance, match scores, and negotiate trades
- **Demand Heatmaps** - Visualize crowdsourced consumer demand signals on a map; see where products are requested most to identify expansion opportunities
- **Community Campaigns** - Petition for new stores, product categories, or brands in your neighborhood; gather signatures to show demand
- **Pindrops (B2C)** - Consumers drop pins to request products they want, creating demand signals visible to retailers

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State | TanStack Query (React Query), React Router v7 |
| Backend | Hono (edge-ready HTTP server), tRPC 11 |
| Database | Drizzle ORM, MySQL |
| Auth | Supabase Auth (email/password), Kimi OAuth, Google Sign-In |
| AI | Google Gemini 2.5 Flash |
| Maps | Leaflet, Leaflet.heat |
| Hosting | Docker, Vercel (serverless), or Node.js |

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL database (local or hosted)
- Supabase project for authentication

### Installation

```bash
# Navigate to the app directory
cd app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
# At minimum, you need DATABASE_URL and Supabase credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Development Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production (Vite + esbuild)
npm run start        # Run production server (requires build first)
npm run lint         # Run ESLint
npm run check        # TypeScript type checking
npm run test         # Run tests with Vitest
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema changes directly to database
npm run db:migrate   # Run pending migrations
```

## Environment Variables

See `.env.example` for all required variables. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `APP_SECRET` | JWT signing secret (32+ chars) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GEMINI_API_KEY` | Gemini API key for Genie AI |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

## Deployment

### Docker

```bash
# Build the image
docker build -t shutter .

# Run the container
docker run -p 3000:3000 --env-file .env shutter
```

### Vercel

The repository includes an `api/index.ts` entry point for Vercel serverless deployment. Set environment variables in your Vercel dashboard.

### Traditional Hosting

```bash
npm run build
npm run start
```

Requires Node.js 20+ and a MySQL database.

## Project Structure

```
app/
  api/              # tRPC routers and Hono server
    kimi/           # Kimi OAuth integration
    lib/            # Shared utilities (cookies, env, HTTP)
    queries/        # Database query helpers
    *-router.ts     # Feature-specific tRPC routers
    boot.ts         # Hono app entry point
  contracts/        # Shared types, constants, errors
  db/               # Drizzle schema, relations, migrations
  src/              # React frontend
    components/     # Reusable UI components
    pages/          # Route-level page components
    providers/      # React context providers
  public/           # Static assets
```

## License

MIT
