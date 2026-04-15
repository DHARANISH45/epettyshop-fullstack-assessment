# Merchant Automation Hub 🚀

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Merchant Automation Hub** is a production-level, multi-tenant workflow engine designed to help e-commerce merchants automate complex business processes. From order processing to personalized customer notifications, this platform provides a visual and logic-driven way to orchestrate operations at scale.

---

## 📖 Table of Contents
- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Solution Approach](#solution-approach)
- [Architecture Explanation](#architecture-explanation)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)

---

## 🌟 Project Overview
Modern e-commerce requires lightning-fast responses to various events (e.g., `ORDER_PLACED`, `PAYMENT_FAILED`, `INVENTORY_LOW`). Merchant Automation Hub allows merchants to define **Workflows** consisting of **Steps** and **Rules**. 

When an event is triggered, our high-performance **Execution Engine** evaluates rules using JEXL expressions and determines the next logical step in real-time, providing full audit logs of every decision made.

---

## ❗ Problem Statement
Merchants often face:
1.  **Operational Bottlenecks**: Manual handling of repetitive tasks (e.g., manual refunds for failed payments).
2.  **Lack of Flexibility**: Hard-coded logic in monolithic systems that is difficult to change without code deployments.
3.  **No Visibility**: Difficult to track why a specific business action was or wasn't taken for a particular transaction.
4.  **Security Risks**: Mixing data between different merchants (tenants) in a single database.

---

## ✅ Solution Approach
We built a decoupled, event-driven system that features:
-   **Visual Workflow Builder**: A low-code interface for managing complex logic.
-   **Dynamic Rule Engine**: Utilizing JEXL to allow complex conditional logic without writing code.
-   **Strict Multi-Tenancy**: Every request is scoped to a `tenant_id` via custom middleware, ensuring 100% data isolation.
-   **Execution Transparency**: Every workflow execution is logged step-by-step, allowing for easy debugging and auditing.

---

## 🏗️ Architecture Explanation

### High-Level System Design
```mermaid
graph TD
    subgraph Client_Layer["Client Layer (React)"]
        UI["Workflow Builder UI"]
        Sim["Execution Simulator"]
    end
    
    subgraph API_Gateway["API Layer (Express)"]
        Auth["Tenant Middleware"]
        Router["REST API Routes"]
    end
    
    subgraph Logic_Engine["Execution Engine"]
        Engine["Workflow Orchestrator"]
        Evaluator["JEXL Rule Evaluator"]
    end
    
    subgraph Data_Layer["Data Layer (PostgreSQL)"]
        ORM["Prisma ORM"]
        DB[(PostgreSQL)]
    end
    
    UI --> Auth
    Auth --> Router
    Router --> Engine
    Engine --> Evaluator
    Engine --> ORM
    ORM --> DB
```

### Key Architectural Decisions
1.  **Tenant Isolation**: We use a `tenant_id` at the database level for every table. Middleware extracts this ID from the `x-tenant-id` header to scope all queries.
2.  **JEXL (Javascript Expression Language)**: Chosen over custom parsers for its safety and power in evaluating dynamic logic strings at runtime.
3.  **Prisma ORM**: Provides type-safe database access, which reduces runtime errors and accelerates development.
4.  **Vite + TypeScript**: Ensures a lightning-fast developer experience and robust frontend type-checking.

---

## 🛠️ Tech Stack

### Frontend
-   **React + Vite**: For a high-performance, component-based UI.
-   **Tailwind CSS**: For rapid, consistent, and responsive styling.
-   **TanStack Query/Router**: For optimized data fetching and type-safe routing.
-   **Lucide React**: For premium iconography.

### Backend
-   **Node.js & Express**: Lightweight and scalable server framework.
-   **TypeScript**: Added for static typing across the full stack.
-   **Prisma ORM**: Modern database toolkit for PostgreSQL.
-   **JEXL**: For safe expression evaluation.

### Infrastructure
-   **PostgreSQL**: Robust relational database.
-   **Docker**: For containerized environment consistency.

---

## 📊 Database Schema
The database is structured to support high-speed lookups and logical nesting.

-   **Workflow**: The parent container for automation logic.
-   **Step**: Individual actions (Action, Approval, Notification).
-   **Rule**: Conditional logic that determines the flow between steps.
-   **Execution**: A permanent log of a workflow run, capturing input data and results.

```prisma
// Simplified Schema Overview
model Workflow {
  id            String      @id @default(uuid())
  tenant_id     String
  name          String
  trigger_event String
  is_active     Boolean
}

model Step {
  id          String   @id @default(uuid())
  workflow_id String
  name        String
  step_type   StepType
  step_order  Int
}
```

---

## 🔌 API Documentation

### Workflows
-   `GET /api/workflows` - List all active workflows for the tenant.
-   `POST /api/workflows` - Create a new automation workflow.
-   `GET /api/workflows/:id` - Get detailed workflow configuration including steps/rules.

### Execution
-   `POST /api/execute` - Trigger a workflow execution.
    -   *Body*: `{ "workflowId": "uuid", "data": { "orderAmount": 500 } }`
-   `GET /api/executions` - View historical execution logs.

---

## 🚀 Setup Instructions

### Prerequisites
-   **Node.js** (v18+)
-   **Docker**
-   **npm** or **yarn**

### 1. Database Setup
Start the PostgreSQL container:
```bash
docker-compose up -d
```

### 2. Backend Configuration
1.  Navigate to `/backend`
2.  Install dependencies: `npm install`
3.  Create a `.env` file:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/merchant_hub"
    PORT=3000
    ```
4.  Run migrations: `npx prisma db push`
5.  Start server: `npm run dev`

### 3. Frontend Configuration
1.  Navigate to `/frontend`
2.  Install dependencies: `npm install`
3.  Start dev server: `npm run dev`

---

## 🚢 Deployment
**Merchant Automation Hub** is designed to be cloud-native:
-   **CI/CD**: GitHub Actions for automated testing and linting.
-   **Containerization**: Use the provided `Dockerfile` (to be added) for backend deployment.
-   **Database**: RDS or Supabase for managed PostgreSQL.
-   **Hosting**: Vercel/Netlify for the React frontend, AWS/Heroku for the Node.js backend.

---

## 🔮 Future Improvements
1.  **AI Rule Suggestions**: Integrate LLMs to suggest rules based on simple English descriptions.
2.  **Webhooks & 3rd Party Integrations**: Native connectors for Shopify, Stripe, and Slack.
3.  **Real-time Analytics**: A dashboard showing the financial "ROI" of automated workflows.
4.  **Versioning**: Allow merchants to version their workflows and roll back if needed.

---


