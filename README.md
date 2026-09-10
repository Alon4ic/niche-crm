# Niche CRM for Warehouse and Manufacturing (React + Node.js)

This is a portfolio and startup-ready multi-tenant CRM designed for manufacturing and warehouse companies.

## 🚀 Technology Stack

### Frontend
- **Framework:** React 18+ (Vite)
- **Language:** TypeScript
- **State Management:** TanStack Query (React Query) + Zustand
- **UI & Styling:** Mantine or shadcn/ui + Tailwind CSS
- **Internationalization (i18n):** react-i18next

### Backend
- **Framework:** NestJS (Node.js)
- **Database ORM:** Prisma
- **Task Queue:** BullMQ + Redis
- **Security:** JWT (Access/Refresh), PostgreSQL Row-Level Security (RLS)

### Database & Storage
- **Primary Database:** PostgreSQL
- **Cache & Queue:** Redis
- **Object Storage:** Cloudflare R2 / Backblaze B2 (S3-compatible)

---

## 📁 Directory Structure

```text
niche-crm/
├── backend/            # NestJS Application
│   ├── src/
│   │   ├── auth/       # Authentication & Tenants
│   │   ├── catalog/    # Catalog & BOM (Bill of Materials)
│   │   ├── inventory/  # Inventory & Stock reservation
│   │   └── sales/      # CRM & RFQ/KP management
│   ├── prisma/         # Database schema & migrations
│   └── package.json
├── frontend/           # React SPA
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks (TanStack Query)
│   │   ├── store/      # Zustand state stores
│   │   └── pages/      # CRM pages (Dashboard, Inventory, BOM)
│   └── package.json
└── docker-compose.yml  # Local Postgres & Redis setup
```
