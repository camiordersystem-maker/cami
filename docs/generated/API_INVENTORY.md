# Generated API Inventory

> Auto-generated from `src/app/api/**/route.ts`. Authorization is summarized from source markers; route source remains authoritative.

| API | Methods | Access summary | Notes |
|---|---|---|---|
| `/api/addresses/[id]` | `PUT,DELETE` | authenticated | — |
| `/api/addresses` | `GET,POST` | authenticated | — |
| `/api/admin/administrators` | `GET,POST,PUT` | superadmin | — |
| `/api/admin/announcements/[id]` | `DELETE` | admin editor+ (inspect GET separately) | — |
| `/api/admin/announcements` | `GET,POST` | admin editor+ (inspect GET separately) | — |
| `/api/admin/audit-logs` | `GET` | superadmin | — |
| `/api/admin/export/inventory` | `GET` | admin editor+ (inspect GET separately) | — |
| `/api/admin/export/members` | `GET` | admin editor+ (inspect GET separately) | — |
| `/api/admin/export/orders` | `GET` | admin editor+ (inspect GET separately) | — |
| `/api/admin/feature-flags` | `GET,PATCH` | superadmin | — |
| `/api/admin/inventory-warnings` | `GET` | admin | — |
| `/api/admin/inventory/list` | `GET` | admin | — |
| `/api/admin/inventory/receipts` | `GET` | admin | — |
| `/api/admin/inventory` | `PUT` | admin editor+ (inspect GET separately) | — |
| `/api/admin/invoices/[id]` | `GET,PATCH` | admin editor+ (inspect GET separately) | — |
| `/api/admin/invoices/[id]/send` | `POST` | admin editor+ (inspect GET separately) | — |
| `/api/admin/invoices` | `GET,POST` | admin editor+ (inspect GET separately) | — |
| `/api/admin/members/[id]` | `GET,PATCH` | admin editor+ (inspect GET separately) | — |
| `/api/admin/members` | `GET,POST` | admin editor+ (inspect GET separately) | — |
| `/api/admin/orders/[id]/cancel-approve` | `POST` | admin editor+ (inspect GET separately) | — |
| `/api/admin/orders/[id]/cancel-reject` | `POST` | admin editor+ (inspect GET separately) | — |
| `/api/admin/orders/[id]` | `GET,PATCH` | admin editor+ (inspect GET separately) | — |
| `/api/admin/orders` | `GET` | admin | — |
| `/api/admin/products/[id]` | `PUT` | admin editor+ (inspect GET separately) | — |
| `/api/admin/products/list` | `GET` | admin | — |
| `/api/admin/products` | `GET,POST` | admin editor+ (inspect GET separately) | — |
| `/api/admin/ranks` | `GET,POST,PUT` | admin editor+ (inspect GET separately) | — |
| `/api/admin/settings` | `GET,PUT` | admin editor+ (inspect GET separately) | — |
| `/api/admin/terms` | `GET,PUT,PATCH` | admin editor+ (inspect GET separately) | — |
| `/api/admin/upload` | `POST` | admin editor+ (inspect GET separately) | — |
| `/api/announcements/[id]/read` | `POST` | member | — |
| `/api/announcements` | `GET` | member | — |
| `/api/auth/[...nextauth]` | `GET,POST` | public/special | — |
| `/api/feature-flags` | `GET` | authenticated | — |
| `/api/health` | `GET` | public/special | — |
| `/api/invoices/[id]` | `GET` | member | — |
| `/api/member/password` | `PATCH` | member | — |
| `/api/notifications/[id]/read` | `POST` | member | — |
| `/api/notifications` | `GET` | member | — |
| `/api/orders/[id]/cancel-request` | `POST` | member | — |
| `/api/orders/[id]` | `GET` | authenticated | — |
| `/api/orders/export` | `GET` | member | — |
| `/api/orders` | `GET,POST` | member | — |
| `/api/products` | `GET` | authenticated | — |
| `/api/readiness` | `GET` | public/special | — |
| `/api/register` | `POST` | public/special | — |
| `/api/settings` | `GET` | authenticated | — |
| `/api/terms/consent` | `GET,POST` | member | — |
| `/api/webhooks/line` | `POST` | public/special | LINE signature |
