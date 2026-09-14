# BBQ POS

Professional React Native POS for BBQ restaurants. Offline-first, Bluetooth thermal printer ready, shadcn-inspired UI.

## Tech

- **React Native** (Expo managed) + **TypeScript**
- **NativeWind v4** + Tailwind CSS for styling
- **React Navigation** (native-stack + bottom-tabs)
- **expo-sqlite** for offline local storage (works in Expo Go)
- **Zustand** for state
- **expo-secure-store** for the auth session token
- **react-native-bluetooth-escpos-printer** for thermal receipt printing (behind a service interface; requires a dev build for real printing)
- **lucide-react-native** icons

## Quick start

```bash
# 1. Install
npm install

# 2a. Run in Expo Go (everything except Bluetooth printing works)
npx expo start
# Scan the QR code with the Expo Go app

# 2b. Or run on a real device/emulator with a dev build
npx expo prebuild
npx expo run:android    # or run:ios
```

> The app runs in **Expo Go** — login, POS, checkout, orders, inventory, dashboard, and receipt preview all work offline.
> Bluetooth thermal printing requires a dev build because `react-native-bluetooth-escpos-printer` is a custom native module. In Expo Go the printer is gracefully stubbed and shows "No Bluetooth printer found"; transactions still save.

### Login (mock)

```
admin@bbqpos.com
password
```

The credentials are hard-coded in `src/constants/index.ts` and verified by `src/auth/authService.ts`. The auth layer mirrors what a future NestJS `/auth/login` endpoint will return, so swapping it out is a one-file change.

## Architecture

```
src/
├── app/                      # app-level providers (none here — see App.tsx)
├── auth/                     # authService / authStore / types
├── components/
│   ├── ui/                   # shadcn-style primitives
│   └── feature/              # ProductCard, CartItem, StatCard, OrderRowView
├── database/
│   ├── database.ts           # expo-sqlite singleton
│   ├── initDatabase.ts       # migrations + seed
│   ├── schema.ts             # SQL DDL
│   ├── seed.ts               # categories / products / admin
│   └── repositories/         # product / category / order / inventory / sequence
├── services/                 # order / inventory / payment / receipt / printer / sync
├── stores/                   # cart / product / order / settings (Zustand)
├── screens/
│   ├── auth/                 # LoginScreen
│   ├── dashboard/            # DashboardScreen
│   ├── pos/                  # PosScreen, CheckoutSheet, ReceiptDialog
│   ├── orders/               # OrdersScreen, OrderDetailsScreen
│   ├── inventory/            # InventoryScreen, ProductEditScreen, AddStockScreen
│   └── settings/             # SettingsScreen, PrinterSettingsScreen, ReceiptSettingsScreen, ApplicationInfoScreen
├── navigation/               # Root / Auth / App / MainTab navigators + types
├── theme/                    # tokens + cn helper
├── utils/                    # currency / date / errors
├── hooks/                    # (extensible)
└── constants/                # APP_NAME, defaults, mock credentials
```

### Database (SQLite)

Tables: `categories`, `products`, `inventory_transactions`, `orders`, `order_items`, `daily_sequences`, `users`, `app_settings`, `printers`.

`initDatabase.ts` is idempotent: it runs all DDL via `CREATE TABLE IF NOT EXISTS` and seeds only if the users table is empty.

#### Daily order number

`nextOrderNumber()` lives in `database/repositories/sequenceRepository.ts` and uses an exclusive SQLite transaction:

```sql
INSERT INTO daily_sequences(date, last_value) VALUES(?, 0) ON CONFLICT DO NOTHING;
UPDATE daily_sequences SET last_value = last_value + 1 WHERE date = ?;
SELECT last_value FROM daily_sequences WHERE date = ?;
```

It is **not** `COUNT(*) + 1`. The `date` key guarantees a fresh sequence each day and is reliable under concurrent inserts.

### State

Each domain has its own Zustand store: `cartStore`, `productStore`, `orderStore`, `settingsStore`. The auth state lives in `auth/authStore.ts` and is persisted in `expo-secure-store` (not AsyncStorage / localStorage).

### Printer

The printer logic is isolated in `src/services/printerService.ts`. Screens call `printerService.printText(text)` — never the underlying library directly. If the printer is unavailable, **the order is still saved**, and the user sees the toast `Transaction saved, but receipt printing failed`. Re-printing is always available from the Orders screen.

### Sync (future NestJS / Prisma / PostgreSQL)

`services/syncService.ts` is a stub queue. Every order creation enqueues an item; `flush()` would later POST them to the NestJS API. No HTTP calls are made in the POS flow today.

## Features

- **Login** with show/hide password and remember-me
- **Dashboard** with today's sales, orders, items sold, pending, hourly bars, low stock list, recent transactions
- **POS** with category tabs, stock-aware product cards, cart, cash/change keypad, payment
- **Receipt** auto-generated and printable on 58mm ESC/POS thermal printer
- **Orders** with filters (All/Paid/Unpaid/Served/Not served), mark-as-served, reprint
- **Inventory** with create / edit / enable-disable / add stock; low-stock warnings
- **Settings** for account, Bluetooth printer, receipt details, application info

## Scripts

```bash
npm start        # Expo dev server
npm run android  # build & run Android dev build
npm run ios      # build & run iOS dev build
npm run lint     # ESLint
npm run typecheck # tsc --noEmit
```

## Next steps (when backend is ready)

1. Replace `auth/authService.ts` body with `POST {NESTJS_BASE}/auth/login` (same `Session` return shape).
2. Implement `services/syncService.flush()` to push queued operations to the NestJS API.
3. Mirror the SQLite schema in `prisma/schema.prisma` on the backend.
