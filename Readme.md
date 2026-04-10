# Smart Expense & Budget Management System

TypeScript monorepo for personal finance management with budgeting, expense tracking, reports, notifications, and user-isolated data.

## Design Progress Checklist

This repository now explicitly satisfies the following design-progress requirements:

- Base classes, interfaces, and class relationships started
- One design pattern identified and documented in README
- ER diagram with entities, relationships, and cardinality
- SDLC + OOP concepts used

## Base Classes and Interfaces

Domain entities and interfaces are defined in `artifacts/api-server/src/domain/entities.ts`.

Included entities:

- `User`
- `Budget`
- `Category`
- `Expense`
- `Transaction`
- `Report`
- `Notification`
- `PaymentMethod`

Class relationships are represented through foreign-key style properties (`userId`, `budgetId`, `categoryId`, `transactionId`) and typed references where relevant.

## Design Pattern (Documented)

### Repository Pattern

The project identifies and documents the **Repository Pattern** for data access abstraction:

- Controllers/services depend on repository interfaces, not direct persistence details.
- Repository contracts make business logic testable and portable.
- Persistence implementation (Drizzle/PostgreSQL) can be swapped with minimal domain-layer changes.

Current implementation already separates route handlers and schema modules, and this pattern is the formal design direction for maintainability and testability.

## ER Diagram (Entities + Relationships + Cardinality)

The ER model uses these entities:

- User, Budget, Category, Expense, Transaction, Report, Notification, PaymentMethod

Cardinality summary:

- User (1) -> (M) Budget
- User (1) -> (M) Category
- User (1) -> (M) Expense
- User (1) -> (M) Transaction
- User (1) -> (M) Report
- User (1) -> (M) Notification
- User (1) -> (M) PaymentMethod
- Category (1) -> (M) Expense
- Budget (1) -> (M) Expense
- Transaction (1) -> (0..1) Expense (implementation may also model inverse ownership)

###ER Diagram
<img width="1600" height="999" alt="image" src="https://github.com/user-attachments/assets/abdcaaee-3888-44b6-a299-5b32e18f4c4a" />

```
erDiagram
    USER ||--o{ BUDGET : has
    USER ||--o{ CATEGORY : has
    USER ||--o{ EXPENSE : has
    USER ||--o{ TRANSACTION : has
    USER ||--o{ REPORT : generates
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ PAYMENT_METHOD : stores

    CATEGORY ||--o{ EXPENSE : classifies
    BUDGET ||--o{ EXPENSE : covers
    TRANSACTION ||--o| EXPENSE : associated_with

    USER {
      int user_id PK
      string name
      string email
      string password_hash
    }
    BUDGET {
      int budget_id PK
      int user_id FK
      float limit
    }
    CATEGORY {
      int category_id PK
      int user_id FK
      string name
    }
    EXPENSE {
      int expense_id PK
      int user_id FK
      int category_id FK
      int budget_id FK
      int transaction_id FK
      float amount
      datetime date
    }
    TRANSACTION {
      int transaction_id PK
      int user_id FK
      string type
      float amount
      datetime date
    }
    REPORT {
      int report_id PK
      int user_id FK
      string type
      datetime generated_at
    }
    NOTIFICATION {
      int notification_id PK
      int user_id FK
      string message
      datetime date
    }
    PAYMENT_METHOD {
      int method_id PK
      int user_id FK
      string type
    }
```

## SDLC + OOP Concepts

### SDLC

- Planning and requirements analysis
- Domain and architecture design
- Implementation in iterative feature slices
- Validation through type-checking and API schema contracts
- Deployment/operations hardening (ongoing)

### OOP Concepts Applied

- **Abstraction** via interfaces (`IUser`, `IBudget`, etc.)
- **Encapsulation** through entity classes (`User`, `Expense`, etc.)
- **Single Responsibility** by separating domain entities from routing/transport concerns
- **Dependency Inversion direction** via repository-contract-first architecture notes

## Local Development

1. Install dependencies:
   - `corepack pnpm install`
2. Copy environment variables:
   - `cp .env.example .env`
3. Ensure PostgreSQL is running and reachable at `DATABASE_URL`.
4. Push DB schema:
   - `DATABASE_URL=... corepack pnpm --filter @workspace/db run push`
5. Start services:
   - API: `PORT=4001 SESSION_SECRET=... DATABASE_URL=... APP_ORIGIN=http://localhost:3000 corepack pnpm --filter @workspace/api-server run dev`
   - Web: `PORT=3000 BASE_PATH=/ VITE_API_BASE_URL=http://localhost:4001 corepack pnpm --filter @workspace/expense-app run dev`

## Product Improvements Included

- Replit-specific dependencies and config removed from the repository.
- API errors are normalized to JSON for better frontend diagnostics.
- Frontend API base URL is configurable via `VITE_API_BASE_URL`.
- Currency preferences now support both **USD** and **INR (Indian Rupee)** from Settings.

  
