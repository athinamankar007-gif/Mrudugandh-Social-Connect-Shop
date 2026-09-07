# Mrudugandh Social Connect

Responsive storefront for handcrafted Mrudugandh products, with a protected admin catalogue manager.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/mrudugandh-shop run dev` — run the storefront
- `pnpm run typecheck` — full typecheck across all packages
- `PORT=5000 BASE_PATH=/mrudugandh-shop pnpm --filter @workspace/mrudugandh-shop run build` — production storefront build
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mrudugandh-shop/src/App.tsx` — customer routes, cart, dynamic catalogue loading, Clerk routes, and `/admin` entry point
- `artifacts/mrudugandh-shop/src/admin/AdminPanel.tsx` — protected product editor, image upload, variants, inventory, availability, and delete controls
- `artifacts/api-server/src/routes/products.ts` — public product reads and admin-only product CRUD
- `artifacts/api-server/src/routes/storage.ts` — admin-only presigned upload URLs and public object serving
- `lib/db/src/schema/products.ts` — PostgreSQL product table and variant shape
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and Zod schemas

## Architecture decisions

- Clerk authenticates the admin UI; the API independently checks the signed-in user's primary email against `ADMIN_EMAILS`.
- Product data is centralized in PostgreSQL and seeded with the original catalogue only through conflict-safe inserts.
- Product images use Replit App Storage presigned uploads; stored object paths are served through the API for customer rendering.
- The existing customer visual design and demo checkout remain intact while the shop catalogue now comes from the API.

## Product

- Customers can browse, search, filter, view variants, add to cart, complete demo checkout, and view About, Impact, and Contact pages.
- Admins open `/admin`, choose **Open admin login**, sign in through Clerk, and manage the catalogue.
- The configured admin email is stored in the shared `ADMIN_EMAILS` environment variable; do not place it in source code.

## User preferences

- Preserve the existing customer storefront design when adding back-office functionality.
- Use the official uploaded Mrudugandh logo and do not invent product names, prices, or NGO facts.

## Gotchas

- Regenerate API clients after changing `lib/api-spec/openapi.yaml`.
- Push only additive database schema changes with `pnpm --filter @workspace/db run push`; do not reset existing product data.
- Admin create, update, delete, and image upload requests require a valid Clerk session and an email allowed by `ADMIN_EMAILS`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
