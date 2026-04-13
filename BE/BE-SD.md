# Family Finance Manager - Backend Solution Document (Final Enhanced)

## 1. Overview

The **Family Finance Manager Backend** is a secure, performant RESTful API built with **FastAPI** that powers a mobile-first React application for a single family.

It ensures:

* Accurate financial tracking (no double-counting)
* Strong data consistency
* Role-based access control
* Scalable and maintainable architecture

The backend is the **single source of truth** for:

* Transactions
* Loan balances
* Savings pool
* Analytics

---

## 2. Tech Stack

* Framework: FastAPI (async)
* ORM: SQLAlchemy 2.0
* Database: PostgreSQL 16+
* Migrations: Alembic
* Validation: Pydantic v2
* Auth: Google OAuth2 + JWT
* Background Jobs: APScheduler / Celery + Redis
* Deployment: Docker (self-hosted)

---

## 3. Project Structure

```bash
backend/
├── app/
│   ├── main.py
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── api/v1/
│   ├── services/
│   ├── tasks/
│   ├── repositories
│   └── utils/
├── migrations/
├── tests/
└── requirements.txt
```

---

## 4. Database Design

Aligned with ERD with the following guarantees:

### 4.1 Financial Accuracy

* All money fields use: `numeric(15,4)`
* `transactions` is the source of truth for history
* `savings_pool` & `loans` maintain current state

---

### 4.2 Idempotency (NEW - CRITICAL)

To prevent duplicate transactions:

* Each create request must include:

  * `idempotency_key` (UUID)
* Stored in transactions table (unique)

Behavior:

* Duplicate request → return existing transaction
* Prevents double entry due to retries

---

### 4.3 Concurrency Control (CRITICAL)

To avoid race conditions:

* Use DB transactions with:

  * `SELECT ... FOR UPDATE` on:

    * `savings_pool`
    * `loans`

* Isolation level:

  * `REPEATABLE READ` or higher

---

### 4.4 Soft Delete Strategy

* Use `is_active = false` instead of delete
* All queries must filter active records

---

### 4.5 System Generated Transactions

Add field:

* `is_system_generated : boolean`

Used for:

* Recurring transactions
* Audit clarity

---

## 5. Authentication & Authorization

### 5.1 Authentication

* Google OAuth → verify token
* Issue JWT

---

### 5.2 Authorization

#### Super Admin

* Full access
* Manage loans, recurring rules, savings

#### Member

* Add own transactions
* View all data
* Withdraw savings only to self

---

## 6. Standard API Response Format

All APIs follow:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

---

## 7. Core Endpoints

### 7.1 Dashboard

`GET /api/v1/dashboard/summary`

Filters:

* date_from, date_to
* user_ids

---

### 7.2 Transactions

#### GET /transactions (Advanced Filtering)

Supports:

* date range
* users (multi-select)
* type
* purpose
* category
* loan
* account types
* pagination

---

#### POST /transactions

Handles:

##### Income

* Standard income entry

##### Expense

* Normal
* Loan Payment → updates loan
* Savings Contribution → updates savings_pool

##### Transfer

* User ↔ User
* User ↔ Savings

---

## 8. Financial Rules (Strict)

* Transfers DO NOT affect income/expense
* Loan payment:

  * Expense + update loan
* Savings contribution:

  * Expense + increase savings_pool
* Savings withdrawal:

  * Transfer (NOT income)

---

## 9. Transaction Service (Core Logic)

Handles:

* Validation of type + purpose
* Idempotency check
* DB transaction handling
* Loan updates
* Savings updates
* Transfer logic

---

## 10. Loan Management

* Supports multiple loans
* Tracks:

  * total_amount
  * paid_amount
  * remaining_amount

---

### 10.1 Interest Handling (NEW)

#### Flat Interest

* Calculated once

#### Reducing Balance

* Interest calculated via background job

Schedule:

* Daily OR Monthly cron

---

## 11. Savings System

* Centralized `savings_pool`

Updates:

* Contribution → increase balance
* Withdrawal → decrease balance

---

## 12. Recurring Rules

* Managed by Super Admin
* Frequencies:

  * daily, weekly, monthly, yearly

---

### 12.1 Execution

* Background job runs daily
* Generates transactions
* Marks as:

  * `is_system_generated = true`

---

## 13. Error Handling & Logging

### 13.1 Error Logs Table

Stores:

* error_message
* stack_trace
* endpoint
* user_id
* request_payload

---

### 13.2 Error Codes (NEW)

Examples:

* TRANSACTION_INVALID_TYPE
* UNAUTHORIZED_ACTION
* INVALID_TRANSFER
* INSUFFICIENT_SAVINGS

---

## 14. Background Tasks

* Recurring transaction generator
* Loan interest calculator

---

## 15. Security

* JWT authentication
* Role-based access
* Rate limiting
* Input validation
* SQL injection safe

---

## 16. Deployment

* Dockerized backend
* PostgreSQL database
* Environment variables for secrets

---

## 17. Future Enhancements

* Multi-family support
* Notifications
* ML insights
* Export reports

---

## 18. Final Notes

* Backend is the **single source of truth**
* All financial logic must remain server-side
* Frontend should never compute balances

---
