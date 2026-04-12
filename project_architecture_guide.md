# Understanding Merchant Automation Hub

Hello! It's great that you want to dive deep into how your project works. Since we've built this together using AI, let's break down exactly how the pieces fit together and how the database is integrated.

## 1. Overall Architecture

Your project is a **Full-Stack Web Application** split into two main parts:

### **Frontend (The User Interface)**
- **Technology**: React + Vite + TypeScript.
- **Role**: This is what you see in the browser. It handles the layout (buttons, forms, dashboard) and sends requests to the backend.
- **Key Files**: 
  - [frontend/src/api/client.ts](file:///d:/project/frontend/src/api/client.ts): The "messenger" that talks to the backend.
  - `frontend/src/pages/`: Contains the actual screens like the Dashboard and Workflow Builder.

### **Backend (The Brain)**
- **Technology**: Node.js + Express + TypeScript.
- **Role**: It receives requests from the frontend, verifies who is asking (Tenant Isolation), evaluates logic rules using **JEXL**, and talks to the database.
- **Key Files**:
  - [backend/src/index.ts](file:///d:/project/backend/src/index.ts): The entry point where the server starts.
  - `backend/src/api/`: Contains different routes (Workflows, Steps, Rules).

### **Database (The Memory)**
- **Technology**: PostgreSQL.
- **Role**: It permanently stores your workflows, steps, and execution history.
- **Connector**: **Prisma ORM**. Think of Prisma as an interpreter that lets you write JavaScript code to talk to the SQL database.

---

## 2. How Data is Handled

Data flows through the system in a very organized way:

1. **Input**: You enter data on the UI (e.g., a Workflow name).
2. **Request**: The Frontend sends a JSON package to the Backend API.
3. **Middleware**: The Backend checks the `x-tenant-id` header to make sure data is saved for the correct user.
4. **Service/ORM**: The Backend uses `prisma.workflow.create()` to save the data.
5. **Storage**: PostgreSQL stores the record in a table.

---

## 3. Where Database Integration is Added

The database isn't just one file; it's a layer integrated into the backend:

- **Definition**: `backend/prisma/schema.prisma` is the **blueprint**. It tells PostgreSQL exactly what tables to create.
- **Connection**: `backend/.env` holds the "phone number" (Connection String) for the database.
- **Usage**: `backend/src/models/prisma.ts` creates the shared connection instance that all API routes use.

---

## 4. Backend Structure

We use a **Layered Structure**:
- **Entry (`index.ts`)**: Boots the server.
- **Middleware**: Processes requests before they reach the logic (e.g., Error Handling, Logging).
- **Routers (`api/`)**: Handlers that receive specific requests (like "Get all Workflows").
- **Services (`services/`)**: Complex logic (like the **Execution Engine** that runs your rules).

---

# PostgreSQL Integration: Step-by-Step Guide

Here is exactly how we integrated PostgreSQL into your project.

### Step 1: Create the Database
We use **Docker** to run PostgreSQL easily.
- **File**: `docker-compose.yml`
- **What it does**: It tells your computer to download and run a PostgreSQL container.
- **Command**: `docker-compose up -d` (Run this in the root folder).

### Step 2: Define your Tables (The Schema)
Instead of writing complex SQL manually, we use **Prisma**.
- **File**: `backend/prisma/schema.prisma`
- **Example Table Definition**:
```prisma
model Workflow {
  id            String   @id @default(uuid()) @db.Uuid
  name          String   @db.VarChar(255)
  trigger_event String   @db.VarChar(255)
  is_active     Boolean  @default(true)
}
```

### Step 3: Connect Backend to DB
- **Environment Variables**: Open `backend/.env` and ensure your URL looks like this:
  `DATABASE_URL="postgresql://user:password@localhost:5432/db_name"`
- **Prisma Client**: We created `backend/src/models/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
```

### Step 4: Storing and Retrieving Data
In your API files (like `backend/src/api/workflows.ts`), you can now do this:

**To Insert (CREATE):**
```typescript
const newWorkflow = await prisma.workflow.create({
  data: { name: 'My Automation', trigger_event: 'ORDER_CREATED' }
});
```

**To List (SELECT):**
```typescript
const workflows = await prisma.workflow.findMany();
```

---

## Sample SQL Queries (What Prisma does behind the scenes)

If you were to write raw SQL, it would look like this:

1. **CREATE TABLE (Done via `prisma migrate`)**:
   ```sql
   CREATE TABLE "Workflow" (
     "id" UUID PRIMARY KEY,
     "name" VARCHAR(255) NOT NULL,
     "trigger_event" VARCHAR(255) NOT NULL,
     "is_active" BOOLEAN DEFAULT true
   );
   ```

2. **INSERT DATA (Stored)**:
   ```sql
   INSERT INTO "Workflow" ("id", "name", "trigger_event") 
   VALUES (gen_random_uuid(), 'Refund Process', 'PAYMENT_FAILED');
   ```

3. **SELECT DATA (Retrieve)**:
   ```sql
   SELECT * FROM "Workflow" WHERE "is_active" = true;
   ```

---

## Folder Structure Changes

When you add a database, your structure usually grows like this:
```text
backend/
├── prisma/               <-- NEW: Database Blueprint
│   └── schema.prisma
├── src/
│   ├── api/              <-- Routes that use the DB
│   ├── models/           <-- NEW: Database Client 
│   │   └── prisma.ts
│   └── services/         <-- Business logic
└── .env                  <-- NEW: Database credentials
```

---

# The Complete Flow (The Big Picture)

When a user interacts with your app, here is the journey:

1. **User Action**: You click **"Save Workflow"** on the UI.
2. **API Call**: The UI calls `fetch('/api/workflows', { method: 'POST', body: ... })`.
3. **Backend**: Express receives the request. The **Tenant Middleware** attaches your ID.
4. **Database**: The router calls `prisma.workflow.create()`. Prisma sends a SQL command to **PostgreSQL**.
5. **Response**: PostgreSQL confirms the save. Prisma returns the new object. The Backend sends it back as JSON.
6. **UI Update**: The React app receives the JSON and adds the new workflow to your list on the screen!

This flow ensures your data is safe, organized, and available whenever you refresh the page.
