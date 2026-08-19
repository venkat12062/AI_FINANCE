# AI Finance Manager

A comprehensive, production-ready, AI-powered personal finance management system designed to help users track expenses, manage budgets, process receipts via OCR, log expenses via voice commands, and receive intelligent financial insights.

## Problem Statement
Managing personal finances can be tedious, requiring manual entry and complex spreadsheets. Existing solutions often lack intelligent automation, making it difficult for users to track spending patterns, stay within budget, and understand their overall financial health.

## Features
- **User Authentication:** Secure JWT-based authentication with password hashing.
- **Transaction Management:** Full CRUD operations for income and expenses.
- **Budgeting Engine:** Create monthly budgets and track spending automatically.
- **Financial Dashboard:** Unified view of total income, expenses, balance, and recent transactions.
- **Reporting System:** Generate financial summaries and export to PDF/CSV.
- **AI Insights Engine:** Rule-based AI analyzes spending and provides actionable financial health scores.
- **OCR Receipt Scanner:** Automatically extract text, amounts, dates, and categories from uploaded receipts.
- **Voice Expense Entry:** Add expenses naturally via Web Speech API (e.g., "Spent 500 on food today").
- **Smart Notifications:** Automated alerts for budget limits, new insights, and monthly summaries.
- **Production Hardened:** Robust security (XSS, HPP, Rate Limiting), robust error handling, and performance caching.

## Technology Stack
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Security:** bcrypt, jsonwebtoken, express-rate-limit, xss-clean, hpp, helmet
- **Testing:** Jest, Supertest
- **Utilities:** Multer (uploads), Tesseract.js (OCR), pdfkit, json2csv

## Folder Structure
```
AI_FINANCE_MANAGER/
├── backend/
│   ├── config/        # Environment and DB config
│   ├── controllers/   # Route controllers
│   ├── database/      # SQL Schemas and Init scripts
│   ├── middleware/    # Security, Auth, and Upload middlewares
│   ├── routes/        # API Routes definition
│   ├── services/      # Core business logic and DB queries
│   ├── tests/         # Jest/Supertest suite
│   ├── utils/         # Helpers (OCR, FileLogger, PDF, Cache, etc.)
│   └── server.js      # Main Express App
├── docs/              # Technical and deployment documentation
├── .env.example       # Example env variables
├── docker-compose.yml # Docker config
└── package.json       # Node dependencies
```

## Installation Steps
1. Clone the repository: `git clone <repo_url>`
2. Navigate to project root: `cd AI_FINANCE_MANAGER`
3. Install dependencies: `npm install`
4. Copy environment variables: `cp .env.example .env`
5. Configure your `.env` file (see Environment Variables).

## Environment Variables
Create a `.env` file in the root directory:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ai_finance
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```

## Database Setup
1. Ensure MySQL is running on your system.
2. The application will automatically attempt to create the database (`ai_finance`) and required tables on startup via `database-init.js`.
3. If it fails due to permissions, manually create the database and run the `backend/database/schema.sql` script.

## Running Project
Development Mode (Nodemon):
```bash
npm run dev
```
Production Mode:
```bash
npm start
```

## Running Tests
Run the comprehensive test suite with coverage:
```bash
npm run coverage
```

## Deployment Guide
Refer to the `docs/DEPLOYMENT.md` file for detailed instructions on deploying to Render, Railway, and VPS environments.

## Future Enhancements
- Integration with external Plaid APIs for direct bank syncing.
- Multi-currency support and real-time exchange rates.
- Advanced machine learning models for forecasting long-term wealth.

## Contributors
- **Ashwini** - Lead Developer & Architect
