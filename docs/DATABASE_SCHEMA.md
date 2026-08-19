# Database Schema

The AI Finance Manager utilizes a highly normalized, relational MySQL schema.

## Tables

### `users`
- `user_id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(100), Not Null)
- `email` (VARCHAR(100), Unique, Not Null)
- `password_hash` (VARCHAR(255), Not Null)
- `created_at` (TIMESTAMP)
- **Indexes**: Unique Index on `email`

### `categories`
- `category_id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key referencing `users(user_id)`)
- `category_name` (VARCHAR(100), Not Null)
- `category_type` (ENUM('Income', 'Expense'), Not Null)
- `created_at` (TIMESTAMP)

### `transactions`
- `transaction_id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key referencing `users(user_id)`)
- `category_id` (INT, Foreign Key referencing `categories(category_id)`)
- `amount` (DECIMAL(10,2), Not Null)
- `type` (ENUM('Income', 'Expense'), Not Null)
- `description` (TEXT)
- `transaction_date` (DATE)
- `created_at` (TIMESTAMP)
- **Indexes**: Index on `transaction_date`

### `budgets`
- `budget_id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key referencing `users(user_id)`)
- `month` (INT, 1-12)
- `year` (INT)
- `budget_limit` (DECIMAL(10,2))

### `receipts`
- `receipt_id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key referencing `users(user_id)`)
- `image_url` (VARCHAR(255))
- `ocr_text` (TEXT)
- `created_at` (TIMESTAMP)

### `ai_insights`
- `insight_id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key referencing `users(user_id)`)
- `message` (TEXT)
- `insight_type` (ENUM('Recommendation', 'Alert', 'Summary'))
- `created_at` (TIMESTAMP)

### `voice_entries`
- `voice_id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key referencing `users(user_id)`)
- `voice_text` (TEXT)
- `parsed_amount` (DECIMAL(10,2))
- `parsed_type` (ENUM('Income', 'Expense'))
- `created_at` (TIMESTAMP)

### `notifications`
- `notification_id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key referencing `users(user_id)`)
- `title` (VARCHAR(255))
- `message` (TEXT)
- `notification_type` (ENUM('Info', 'Warning', 'Critical', 'Success'))
- `is_read` (BOOLEAN, Default False)

## Relationships
- A `user` has many `categories`, `transactions`, `budgets`, `receipts`, `ai_insights`, `voice_entries`, and `notifications`.
- A `transaction` belongs to exactly one `user` and exactly one `category`.
- If a `user` is deleted, all cascade deletes trigger across related tables.
