# Shutter Architecture

## Overview

Shutter is a B2B retail SaaS platform connecting Indian kirana stores with tools for inventory management, billing, AI insights, peer-to-peer trading, and demand visualization. The architecture follows a monolithic fullstack pattern with clear separation between frontend, API, and data layers.

## Folder Structure

```
app/
├── api/                      # Backend (Hono + tRPC)
│   ├── boot.ts               # Hono app setup, middleware, routes
│   ├── router.ts             # Root tRPC router combining all sub-routers
│   ├── context.ts            # tRPC context (request, user)
│   ├── middleware.ts         # tRPC middleware (auth, role checks)
│   ├── lib/
│   │   ├── env.ts            # Environment variable validation
│   │   ├── cookies.ts        # Session cookie utilities
│   │   └── http.ts           # HTTP helpers
│   ├── kimi/
│   │   ├── auth.ts           # Kimi OAuth flow, session management
│   │   ├── session.ts        # JWT signing/verification
│   │   └── platform.ts       # Kimi platform API client
│   ├── queries/
│   │   ├── connection.ts     # Database connection singleton
│   │   └── users.ts          # User upsert queries
│   ├── auth-router.ts        # Auth: me, logout
│   ├── retailer-router.ts    # Kirana store profile management
│   ├── inventory-router.ts   # Stock tracking, surplus flags
│   ├── bill-router.ts        # QR billing, transactions
│   ├── trade-router.ts       # Surplus matching engine
│   ├── pindrop-router.ts     # Consumer demand pins
│   ├── campaign-router.ts    # Community petitions
│   ├── demand-router.ts      # Aggregated demand data
│   └── genie-router.ts       # AI assistant queries
│
├── contracts/                # Shared types (isomorphic)
│   ├── types.ts              # TypeScript interfaces
│   ├── constants.ts          # App constants (session, paths)
│   └── errors.ts             # Error definitions
│
├── db/
│   ├── schema.ts             # Drizzle table definitions (11 tables)
│   ├── relations.ts          # Drizzle relation mappings
│   ├── seed.ts               # Development seed data
│   └── migrations/           # Generated migrations
│
├── src/                      # Frontend (React)
│   ├── App.tsx               # Route definitions
│   ├── components/
│   │   ├── Navigation.tsx    # App shell, navigation
│   │   ├── AuthLayout.tsx    # Auth flow wrapper
│   │   ├── BarcodeScanner.tsx
│   │   ├── GoogleMapHeatmap.tsx
│   │   └── ui/               # shadcn/ui components
│   ├── pages/
│   │   ├── Landing.tsx       # Public landing page
│   │   ├── Dashboard.tsx     # Retailer dashboard
│   │   ├── Inventory.tsx     # Stock management
│   │   ├── Billing.tsx       # POS billing
│   │   ├── Trades.tsx        # Trade matching
│   │   ├── Heatmap.tsx       # Demand visualization
│   │   ├── Genie.tsx         # AI assistant chat
│   │   └── ...               # Other pages
│   └── providers/            # React Query, Theme providers
│
├── public/                   # Static assets
├── Dockerfile                # Production Docker build
├── drizzle.config.ts         # Drizzle Kit config
└── package.json
```

## Data Model

Shutter uses 11 tables organized around retailers, inventory, billing, and demand signals.

### Core Tables

```
users                  # Kimi/Google OAuth users
├── id (PK)
├── unionId (unique)   # OAuth provider ID
├── name, email, avatar
├── role               # 'user' | 'admin'
└── lastSignInAt

retailers              # Kirana store profiles (B2B)
├── id (PK)
├── userId (FK → users)
├── storeName, ownerName
├── gstin, gstinVerified
├── address, city, state, pincode
├── latitude, longitude, geohash
├── catchmentRadius     # km radius for trade matching
├── subscriptionTier    # 'free' | 'pro'
└── subscriptionStatus  # 'active' | 'inactive' | 'trial'

products               # Product catalog
├── id (PK)
├── name, category, subcategory
├── barcode (unique)
├── mrp, gstRate, unit
└── isActive

inventory              # Per-retailer stock
├── id (PK)
├── retailerId (FK)
├── productId (FK)
├── quantity, lowStockThreshold
├── costPrice, sellingPrice
├── surplusFlag        # 'normal' | 'surplus' | 'dead_stock'
├── expiryDate
└── aiForecastData     # JSON: predicted demand
```

### Billing Tables

```
bills                  # Transactions
├── id (PK)
├── retailerId (FK)
├── billNumber
├── customerPhone
├── subtotal, gstAmount, discount, total
├── paymentMethod      # 'cash' | 'upi' | 'card'
└── status             # 'pending' | 'completed' | 'cancelled'

bill_items             # Line items
├── id (PK)
├── billId (FK)
├── productId (FK)
├── productName, quantity
├── unitPrice, gstRate, lineTotal
```

### Trade & Demand Tables

```
trade_opportunities    # Surplus matching
├── id (PK)
├── sellerRetailerId (FK)
├── buyerRetailerId (FK)
├── productId (FK)
├── quantity, sellerPrice
├── matchScore         # 0-100
├── distance           # km
└── status             # 'pending' → 'completed'

pindrops               # Consumer demand pins (B2C)
├── id (PK)
├── productName, category
├── latitude, longitude, geohash
├── deviceId           # Dedup key
├── urgency            # 'low' | 'medium' | 'high'
└── isActive           # 'active' | 'resolved'

campaigns              # Community petitions
├── id (PK)
├── title, description
├── requestType        # 'new_store' | 'product_category' | 'brand'
├── targetSignatures, currentSignatures
├── latitude, longitude, geohash
└── status             # 'active' | 'achieved' | 'closed'

campaign_signatures
├── id (PK)
├── campaignId (FK)
├── deviceId
└── note

demand_aggregates     # Precomputed heatmap data
├── id (PK)
├── geohash (7-char)  # ~150m precision
├── latitude, longitude
├── category
├── demandScore       # 0-100
├── pindropCount, searchCount, campaignCount
└── successProbability # 'low' | 'medium' | 'high'
```

### AI Tables

```
restock_recommendations
├── id (PK)
├── retailerId (FK)
├── productId (FK)
├── currentStock, recommendedQuantity
├── predictedDemand, confidence
├── reason
└── status             # 'pending' | 'approved' | 'ordered'

genie_queries          # AI assistant history
├── id (PK)
├── retailerId (FK)
├── query, aiResponse
├── locationContext    # JSON: { city, pincode, radius }
└── insights           # JSON: structured output
```

## API Structure

Shutter uses tRPC for type-safe APIs. All routes are under `/api/trpc/`.

### Routers

| Router | Purpose | Key Procedures |
|--------|---------|----------------|
| `auth` | Authentication | `me`, `logout` |
| `retailer` | Store profile | `get`, `upsert`, `byGeohash` |
| `inventory` | Stock management | `list`, `update`, `surplus` |
| `bill` | Billing/POS | `create`, `list`, `items` |
| `trade` | Surplus matching | `opportunities`, `confirm` |
| `pindrop` | Consumer demand | `create`, `nearby` |
| `campaign` | Petitions | `list`, `sign`, `create` |
| `demand` | Aggregates | `heatmap`, `byCategory` |
| `genie` | AI assistant | `ask`, `myQueries`, `quickInsights` |

### Authentication

All authenticated procedures use the `authedQuery` middleware which validates the session cookie and injects `ctx.user`.

```typescript
// Example: Getting the current user
auth.me: authedQuery.query(({ ctx }) => ctx.user)

// Example: Creating a bill (requires auth)
bill.create: authedQuery.mutation(({ ctx, input }) => { ... })
```

## Authentication Flow

Shutter supports three authentication methods:

### 1. Supabase Auth (Email/Password)

Used for traditional email signup/login. Frontend calls Supabase client directly, then syncs session to backend via cookies.

### 2. Google Sign-In

1. Frontend gets `idToken` from Google OAuth
2. POST to `/api/auth/google` with `idToken`
3. Backend verifies token with Google's `tokeninfo` endpoint
4. Backend creates/updates user in database
5. Backend signs JWT session token and sets `kimi_sid` cookie
6. Subsequent requests include cookie, validated by middleware

### 3. Kimi OAuth

Legacy OAuth provider. Flow:

1. User clicks "Sign in with Kimi"
2. Redirect to Kimi authorization URL
3. Kimi redirects back to `/api/oauth/callback`
4. Backend exchanges code for tokens, creates session
5. Sets `kimi_sid` cookie

### Session Cookie

- Name: `kimi_sid`
- Max Age: 365 days
- HTTP-only, Secure in production
- Contains signed JWT with `unionId` claim

## Key Features

### QR Billing

- Scan product barcodes using `html5-qrcode`
- Auto-fill product details from catalog
- Calculate GST per line item
- Generate itemized bills with totals
- Store transactions in `bills` and `bill_items` tables

### Trade Matching

- Sellers flag inventory as `surplus` or `dead_stock`
- Matching engine finds buyers within `catchmentRadius`
- Ranks by `matchScore` (demand + distance + price)
- Both parties confirm before trade completes

### Demand Heatmaps

- Consumer `pindrops` create demand signals
- Aggregated into `demand_aggregates` by geohash
- Visualized with Leaflet.heat plugin
- Helps retailers identify expansion opportunities

### Genie AI

- Natural language queries from retailers
- Context injected: store name, location, local demand data
- Powered by Gemini 2.5 Flash
- Stores query history for reference

## Database Indexes

Performance-critical indexes:

- `retailers`: `userId`, `geohash`, `city`, `gstin`
- `inventory`: `retailerId`, `productId`, `surplusFlag`
- `bills`: `retailerId`, `createdAt`
- `trade_opportunities`: `sellerRetailerId`, `buyerRetailerId`, `status`
- `pindrops`: `geohash`, `category`, `createdAt`
- `demand_aggregates`: `geohash`, `category`, `demandScore`
