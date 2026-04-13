# Family Finance Manager - Frontend Solution Document

## 1. Overview

A mobile-first web application for a single family (4 members) to collaboratively manage:

* Income
* Expenses
* Internal transfers
* Multiple loans (with interest tracking)
* Shared savings (with contributions & withdrawals)
* Recurring financial rules (expenses & savings)

The system ensures **accurate financial tracking**, **role-based control**, and **real-life usability**.

---

## 2. Core Design Principles

* Mobile-first responsive UI
* Fast, low-friction data entry
* Financial correctness (no double counting)
* Clear separation of financial flows:

  * Income
  * Expense
  * Transfer
  * Loan payments
  * Savings contributions
  * Savings withdrawals

---

## 3. User Roles

### 3.1 Super Admin

* Full control over system
* Can:

  * Add/edit/delete any transaction
  * Manage multiple loans
  * Configure savings (initial + recurring)
  * Configure recurring expenses/savings (daily/weekly/monthly/yearly)
  * Withdraw savings to any user
  * View all analytics

---

### 3.2 Members

* Can:

  * Add their own transactions
  * View all family data
  * Withdraw savings only to themselves
* Cannot:

  * Edit others’ data
  * Manage loans
  * Configure recurring rules

---

## 4. Authentication

* Google OAuth login
* Role determined from backend mapping

---

## 5. Application Screens

---

### 5.1 Login Page

* Google Sign-In button

---

### 5.2 Dashboard (Home)

#### Summary Cards

* Total Income
* Total Expense
* Net Balance
* Total Loan Remaining
* Total Savings Balance

---

#### Visualizations

* Category-wise spending (Pie chart)
* Monthly trend (Line chart)
* User-wise spending (Bar chart)

---

#### Advanced Filters

* Date range (custom)
* Users (multi-select)
* Transaction type
* Purpose
* Loan selection (per-loan analysis)

---

### 5.3 Add Transaction Screen

#### Fields

* Type:

  * Income
  * Expense
  * Transfer

* Amount

* Date (default: today)

* Notes

---

#### Conditional Logic

##### Income

* Source input
* If source = family member → auto-converted to Transfer

---

##### Expense

* Category (including loans, debt, savings)
* Optional tagging:

  * Loan Payment
  * Savings Contribution

---

##### Transfer

* From:

  * User OR Savings Pool
* To:

  * User OR Savings Pool

---

#### Smart Defaults

* Logged-in user auto-selected
* Super admin can override

---

### 5.4 Transactions List

* Scrollable with filters

#### Display:

* Type
* Amount
* Person
* Category / Purpose
* Date

#### Actions:

* Edit/Delete (role-based)

---

### 5.5 Loan Management Screen (Admin Only)

#### Features:

* Create & manage multiple loans

#### Each Loan:

* Name
* Total amount
* Interest configuration:

  * Flat interest
  * Reducing balance (future-ready)

---

#### Visualization:

* Paid vs Remaining
* Progress bar
* Payment history

---

### 5.6 Savings Screen

#### Shared Savings Pool

Displays:

* Total balance
* Contribution history
* Withdrawal history

---

#### Actions

##### Contribution

* Via transaction (expense + savings tag)

---

##### Withdrawal

* Treated as Transfer:

  * From: Savings Pool
  * To: User

Rules:

* Members → only to themselves
* Admin → to any user
* ❌ Does NOT count as income

---

#### Recurring Savings (Admin Only)

Supports:

* Daily
* Weekly
* Monthly
* Yearly

Fields:

* Amount
* Assigned user
* Frequency
* Start date

---

### 5.7 Recurring Rules Screen (Admin Only)

Supports:

#### Types:

* Savings Contribution
* Expenses (e.g., rent, EMI)

---

#### Frequencies:

* Daily
* Weekly
* Monthly
* Yearly

---

#### Behavior:

* Automatically generates transactions on schedule

---

### 5.8 Budget Screen

#### Features:

* Set monthly budget

#### Displays:

* Budget
* Used
* Remaining

---

## 6. Financial Logic (Frontend Rules)

---

### 6.1 Transaction Types

* Income
* Expense
* Transfer

---

### 6.2 Purpose Tags

* Normal
* Loan Payment
* Savings Contribution

---

### 6.3 Core Rules

#### Transfers

* Do NOT affect total income/expense

---

#### Loan Payments

* Expense
* Linked to loan
* Updates handled by backend

---

#### Savings Contribution

* Expense
* Increases savings pool

---

#### Savings Withdrawal

* Transfer (Savings → User)
* Not income

---

#### Recurring Transactions

* Auto-created by system
* Follow defined schedule

---

## 7. Filtering System

Supports:

* Any custom date range
* Multi-user selection
* Transaction type
* Category
* Purpose
* Loan-specific filtering

---

## 8. Charts & Visualization

Selectable charts:

* Pie → Category distribution
* Bar → User comparison
* Line → Trends over time

---

## 9. State Management

* React Query → server data
* Local state → UI filters

---

## 10. API Interaction Rules

* Backend handles:

  * All calculations
  * Loan updates
  * Savings updates
  * Recurring execution

* Frontend:

  * Sends filters
  * Renders data

---

## 11. UX Considerations

* Minimal clicks for entry
* Smart defaults
* Clear labeling of financial types
* Avoid user confusion between:

  * Expense vs Transfer
  * Savings vs Loan

---

## 12. Error Handling

* Input validation
* Unauthorized actions
* Network errors

---

## 13. Tech Stack

* React (Vite / Next.js)
* Tailwind CSS
* Recharts
* React Query

---

## 14. Deployment

* Hosted on Vercel
* Backend: Python FastAPI (self-hosted)

---

## 15. Future Enhancements

* PWA (offline mode)
* Notifications
* ML-based insights
* Export reports
* Multi-family support

---
