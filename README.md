# PH Point of Sale (POS)

A single-store Point of Sale system built for Philippine retail: Next.js (App Router) + React + Tailwind CSS on the frontend, Next.js API routes + Prisma + MySQL on the backend, with GCash and Card payments wired up via **PayMongo** (disabled by default while you're testing — cash sales work immediately).

## Features

- **Sales Terminal (`/pos`)** — searchable product grid, cart, cash/GCash/card checkout, printable receipt, live stock deduction
- **Products & Inventory (`/products`)** — add/edit/deactivate products, manage categories, low-stock visibility
- **Orders (`/orders`)** — full transaction history with receipt lookup
- **Dashboard (`/dashboard`)** — today's sales, 7-day chart, sales by payment method, top products, low-stock alerts
- **Users (`/users`, Admin only)** — create Cashier/Admin accounts, change roles, remove staff
- **Auth** — JWT-based login stored in an httpOnly cookie, route protection via Next.js middleware, Admin-only API guards
- **Philippine specifics** — peso (₱) formatting, 12% VAT calculated as VAT-inclusive on displayed prices, GCash + Card via PayMongo

## Tech stack

| Layer      | Choice                                   |
|------------|-------------------------------------------|
| Frontend   | React 18, Next.js 14 (App Router), Tailwind CSS |
| Backend    | Next.js API routes (Node.js)             |
| Database   | MySQL, via Prisma ORM                    |
| Auth       | JWT (jsonwebtoken) + bcrypt              |
| Payments   | PayMongo (GCash + Cards) — off by default |
| Charts     | Recharts                                 |

## 1. Prerequisites

- Node.js 18+
- A running MySQL server (local install, Docker, or a hosted instance like PlanetScale/Railway)

## 2. Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env and set DATABASE_URL to your MySQL connection string, e.g.:
# DATABASE_URL="mysql://root:yourpassword@localhost:3306/pos_db"

# 3. Create the database schema
npx prisma migrate dev --name init

# 4. Seed demo data (admin/cashier accounts + sample products)
npm run prisma:seed

# 5. Run the app
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

**Demo accounts** (created by the seed script):
- Admin: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`

> Change these passwords (or delete the demo users from `/users`) before using this in production.

## 3. Online payments (GCash & Cards) — currently OFF

You said you don't need online payments yet, so they're **disabled by default** via:

```
NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS="false"
```

With this flag off:
- Cash checkout works fully, right now, with no extra setup.
- The GCash/Card buttons are still visible on the checkout screen (so you can see the intended UX) but are marked "test" and blocked from completing, with a clear message.

### Turning payments on later

1. Create a free account at https://dashboard.paymongo.com and grab your **TEST** keys first (Developers → API Keys).
2. In `.env`, set:
   ```
   NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS="true"
   PAYMONGO_SECRET_KEY="sk_test_xxxxxxxxxxxx"
   PAYMONGO_PUBLIC_KEY="pk_test_xxxxxxxxxxxx"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"   # or your deployed URL
   ```
3. Restart the dev server.
4. For GCash: the terminal creates a PayMongo "source," redirects the customer to authorize in GCash, then returns to `/pos`. The order is created as `PENDING` and flips to `PAID` (with stock deducted) once PayMongo's webhook confirms payment.
5. For Cards: a payment intent is created; in production you'd pair this with PayMongo.js / a hosted card field (never post raw card numbers through your own server).
6. Point a PayMongo webhook at `https://yourdomain.com/api/payments/webhook` (events: `payment.paid`, `payment.failed`). Before going live, add signature verification in `app/api/payments/webhook/route.js` (there's a comment marking where).
7. Switch to `sk_live_...` / `pk_live_...` keys only once you're ready to accept real money.

Cash sales never touch PayMongo and are unaffected by this flag.

## 4. Project structure

```
app/
  pos/page.js            # Sales terminal
  products/page.js        # Product & category management
  orders/page.js           # Order history
  dashboard/page.js        # Reports & charts
  users/page.js            # Admin: staff accounts
  login/page.js
  api/
    auth/                  # login, logout, me
    products/, categories/ # inventory CRUD
    orders/                # checkout + history (VAT, stock, payment branching)
    users/                 # admin-only staff management
    dashboard/             # aggregated report queries
    payments/webhook/      # PayMongo webhook receiver
components/                # Navbar, Cart, ProductGrid, CheckoutModal, ReceiptModal, AppShell
lib/
  prisma.js                # Prisma client singleton
  auth.js                  # JWT sign/verify + cookie helpers
  paymongo.js               # GCash/Card API wrapper (only called if payments are enabled)
prisma/
  schema.prisma
  seed.js
middleware.js               # Route protection (redirects unauthenticated users to /login)
```

## 5. Notes on the numbers

- Product prices are entered **VAT-inclusive** (the price you'd display on a shelf/menu already includes 12% VAT), matching typical PH retail practice. The receipt breaks out the VAT component for you automatically.
- Stock is decremented server-side inside a DB transaction at the moment a cash sale completes (or when an online payment is confirmed via webhook), and product prices are always re-read from the database at checkout — the frontend cart never dictates the final price.
- Deleting a product from the UI is a **soft delete** (`isActive = false`) so historical orders and reports stay accurate.

## 6. Next steps you may want

- Add discounts/promos UI (the `discount` field already exists on `Order`)
- Add senior citizen / PWD VAT-exempt pricing rules (common PH requirement)
- Multi-branch/terminal support (you mentioned single-store for now, but `Order`/`User` are structured so a `branchId` could be added later without a rewrite)
- Barcode scanner input (just needs a text input that appends into the SKU search box)
- Daily Z-reading / end-of-shift cash reconciliation report
