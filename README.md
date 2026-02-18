# MailMesh 📧

**Multi-Vendor Email Gateway API** (SaaS-Ready)

MailMesh is a powerful, multi-tenant email API that unifies providers like SendGrid, Brevo, Mailgun, and AWS SES behind a single interface. It features smart routing, automatic failover, and detailed analytics.

---

## 🚀 Key Features

- **Multi-Tenant Workspaces**: Isolated environments for different teams or clients.
- **Smart Routing Engine**:
  - **Priority/Failover**: Automatically switch to backup providers on failure.
  - **Round-Robin**: Distribute load across multiple accounts.
  - **Least-Used**: Optimize for daily quotas.
  - **Conditional**: Route by sender, domain, tags, or metadata.
- **Provider Agnostic**: Unified API for SendGrid, Brevo, Mailgun, Postmark, Resend, SES, and SMTP.
- **Reliable Delivery**: Built-in queue system (BullMQ + Redis) with exponential backoff retries.
- **Security**:
  - AES-256-GCM encryption for provider credentials.
  - SHA-256 hashed API keys.
  - Tenant-scoped data access.
- **Webhooks**:
  - **Inbound**: Normalization of events (delivered, bounced, opened, etc.) from all providers into a standard format.
  - **Outbound**: Real-time event delivery to your application with HMAC signing.

## 🛠 Tech Stack

- **Runtime**: [Bun](https://bun.sh) (High-performance JS runtime)
- **Framework**: [Hono](https://hono.dev) (Fast, lightweight web framework)
- **Database**: PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)
- **Queue**: Redis + [BullMQ](https://bullmq.io)
- **Validation**: [Zod](https://zod.dev)
- **Language**: TypeScript

---

## 📦 Installation

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- PostgreSQL database
- Redis instance

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/mailmesh.git
cd mailmesh
bun install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mailmesh"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-key"
ENCRYPTION_KEY="32-byte-hex-string..."
```

### 3. Database Migration

Generate and apply the database schema:

```bash
bun run db:generate
bun run db:migrate
```

### 4. Start Server

```bash
# Development mode with hot reload
bun run dev

# Production build
bun run build
bun start
```

Server runs on `http://localhost:3000` by default.

---

## 📚 API Overview

### Authentication

- **Dashboard API**: Uses JWT (Bearer token).
- **Client API (v1)**: Uses API Keys (`Authorization: Bearer mm_live_...`).

### Core Endpoints

| Method | Endpoint            | Description                                   |
| ------ | ------------------- | --------------------------------------------- |
| `POST` | `/auth/signup`      | Create a new user and workspace               |
| `POST` | `/auth/login`       | Login and get JWT token                       |
| `POST` | `/v1/email/send`    | Send a single or bulk email                   |
| `GET`  | `/v1/email/:id`     | Check email status                            |
| `POST` | `/v1/providers`     | Add an email provider (credentials encrypted) |
| `POST` | `/v1/routing-rules` | Configure routing logic                       |
| `GET`  | `/v1/analytics`     | Get workspace delivery stats                  |

---

## 🛡️ License

MIT
