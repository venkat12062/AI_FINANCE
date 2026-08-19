# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register
- **Method:** POST
- **URL:** `/auth/register`
- **Headers:** None
- **Request Body:**
  ```json
  { "name": "John", "email": "john@test.com", "password": "Password1!" }
  ```
- **Response Body:**
  ```json
  { "success": true, "data": { "token": "jwt_token...", "user": { "id": 1, "email": "john@test.com" } } }
  ```
- **Status Codes:** 201 Created, 400 Bad Request (Duplicate/Validation)

### Login
- **Method:** POST
- **URL:** `/auth/login`
- **Headers:** None
- **Request Body:**
  ```json
  { "email": "john@test.com", "password": "Password1!" }
  ```
- **Response Body:**
  ```json
  { "success": true, "data": { "token": "jwt_token..." } }
  ```
- **Status Codes:** 200 OK, 401 Unauthorized

## Profile (Protected)
*Note: All endpoints below require `Authorization: Bearer <token>` in the Headers.*

### Get Profile
- **Method:** GET
- **URL:** `/profile`
- **Status Codes:** 200 OK, 401 Unauthorized

## Categories (Protected)

### Get Categories
- **Method:** GET
- **URL:** `/categories`
- **Response Body:**
  ```json
  { "success": true, "data": [ { "categoryId": 1, "categoryName": "Food", "type": "Expense" } ] }
  ```

### Create Category
- **Method:** POST
- **URL:** `/categories`
- **Request Body:** `{ "categoryName": "Travel", "categoryType": "Expense" }`
- **Status Codes:** 201 Created

## Income & Expenses (Protected)

### Add Income/Expense
- **Method:** POST
- **URL:** `/income` or `/expenses`
- **Request Body:**
  ```json
  { "categoryId": 1, "amount": 500, "description": "Lunch", "transactionDate": "2023-10-01" }
  ```
- **Status Codes:** 201 Created, 400 Bad Request

### Get Analytics Summary
- **Method:** GET
- **URL:** `/expenses/summary`
- **Response Body:**
  ```json
  { "success": true, "data": { "totalExpense": 5000, "thisMonthExpense": 200 } }
  ```

## Budgets (Protected)

### Create Budget
- **Method:** POST
- **URL:** `/budgets`
- **Request Body:** `{ "month": 10, "year": 2023, "budgetLimit": 1000 }`
- **Status Codes:** 201 Created, 400 Duplicate

### Get Budget Progress
- **Method:** GET
- **URL:** `/budgets/progress`
- **Response Body:**
  ```json
  { "success": true, "data": [ { "budgetId": 1, "limit": 1000, "spent": 400, "percentageUsed": 40, "remaining": 600 } ] }
  ```

## Dashboard & Reports (Protected)

### Dashboard Overview
- **Method:** GET
- **URL:** `/dashboard/overview`
- **Status Codes:** 200 OK (Returns total income, expense, balance, and recent transactions)

### Export Reports
- **Method:** GET
- **URL:** `/reports/export/csv` (or `/pdf`)
- **Response Headers:** `Content-Type: text/csv` (or `application/pdf`)
- **Status Codes:** 200 OK

## AI & Automation (Protected)

### Get AI Health Score
- **Method:** GET
- **URL:** `/ai/health`
- **Response Body:** `{ "success": true, "data": { "healthScore": 85 } }`

### Upload Receipt (OCR)
- **Method:** POST
- **URL:** `/receipts/upload`
- **Headers:** `Content-Type: multipart/form-data`
- **Request Body:** form-data with file field `receipt`
- **Response Body:** Extracts text and creates an expense transaction if parsed successfully.

### Process Voice Command
- **Method:** POST
- **URL:** `/voice/process`
- **Request Body:** `{ "transcript": "Spent 500 on food today" }`
- **Status Codes:** 201 Created (Expense automatically generated)

## Notifications (Protected)

### Generate Alerts
- **Method:** POST
- **URL:** `/notifications/generate`
- **Status Codes:** 200 OK (Calculates budget thresholds and generates alerts)
