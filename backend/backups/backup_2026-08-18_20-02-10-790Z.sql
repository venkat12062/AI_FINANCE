-- AI Finance Manager Database Backup
-- Generated: 2026-08-18T20:02:10.790Z

-- Table: users
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('1', 'Ashwini', 'ashwini.test@finance.com', '$2b$10$Fp1ZSTzfTqnFIKAyffM/9uHOFmlWAnL9MkxX9yoBpO/HC0rffbj0C', '2026-08-16 20:09:52', '2026-08-16 20:09:52');
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('2', 'Ashwini Live', 'ashwini.live@finance.com', '$2b$10$r0JHfqUgwFYnAxwfSgGt.uBvHrXqoxQp2Rp0psqJrhNCHLujKf8zS', '2026-08-16 20:16:41', '2026-08-16 20:16:41');
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('3', 'Ashwini', 'ashwini@finance.com', '$2b$10$Pv4l.sW/tbd9v2Y7xTU7BulGKm/0IFIVSPfuwQ0A889mWQjkbNYzG', '2026-08-16 20:22:22', '2026-08-16 20:22:22');
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('4', 'Ashwini Final', 'ashwini.final@finance.com', '$2b$10$mW6uhTmDhol/ZqcHeYT0kO7KlHFYeDwBKsbHyLHWJDM2IKFBWjVIy', '2026-08-18 19:03:26', '2026-08-18 19:03:26');
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('5', 'Audit User', 'audit_1787080505397@finance.com', '$2b$10$efC2.zfmcB6/EAow2HzvZOiRRb.L01X1iPsg9XlJzu1AJzGrWRFvK', '2026-08-18 19:15:05', '2026-08-18 19:15:05');
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('6', 'Audit User Updated', 'audit_1787080576893@finance.com', '$2b$10$DNlnlj2K/RCCXe9pl1XI2OA3geZnsWC7gBTghIcBDwR9xCM8LiEoi', '2026-08-18 19:16:17', '2026-08-18 19:16:17');
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('7', 'Audit User Updated', 'audit_1787082123120@finance.com', '$2b$10$MVnc3SMRt0K2nbxOl0NytOkxIESZf/x7qKhOShc0dCwDuT.hmTG76', '2026-08-18 19:42:03', '2026-08-18 19:42:03');
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('8', 'Audit User Updated', 'audit_1787083025475@finance.com', '$2b$10$d99E7GoHxT25cb5vtUobceVtGyKYTFDkk3nvRSPHeoZvI.PKH.JAa', '2026-08-18 19:57:05', '2026-08-18 19:57:05');
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES ('9', 'Audit User Updated', 'audit_1787083330399@finance.com', '$2b$10$A7kchEh57offiGUmP584F.pszLtjS0OBY4UiQfIqg7qk1XyXaKl/e', '2026-08-18 20:02:10', '2026-08-18 20:02:10');

-- Table: categories
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('1', NULL, 'Food', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('2', NULL, 'Travel', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('3', NULL, 'Shopping', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('4', NULL, 'Medical', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('5', NULL, 'Education', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('6', NULL, 'Entertainment', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('7', NULL, 'Bills', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('8', NULL, 'Rent', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('9', NULL, 'Salary', 'Income');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('10', NULL, 'Freelance', 'Income');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('11', NULL, 'Business', 'Income');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('12', NULL, 'Investment', 'Income');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('13', NULL, 'Bonus', 'Income');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('14', '3', 'salary', 'Income');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('15', '5', 'TestCat_1787080505671', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('16', '6', 'TestCat_1787080577199', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('17', '7', 'TestCat_1787082123390', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('18', '8', 'TestCat_1787083025746', 'Expense');
INSERT INTO categories (category_id, user_id, category_name, category_type) VALUES ('19', '9', 'TestCat_1787083330630', 'Expense');

-- Table: transactions
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('1', '1', '1', '250', 'Expense', 'Dinner with friends', '2026-08-16', '2026-08-16 20:10:14', '2026-08-16 20:10:14');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('2', '1', '9', '5000', 'Income', 'Monthly Salary', '2026-08-16', '2026-08-16 20:11:57', '2026-08-16 20:11:57');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('3', '3', '9', '50000', 'Income', '', '2026-08-16', '2026-08-16 20:29:58', '2026-08-16 20:29:58');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('4', '3', '1', '100', 'Expense', '', '2026-08-16', '2026-08-16 20:36:13', '2026-08-16 20:36:13');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('5', '5', '9', '4500', 'Income', 'Monthly Salary Audit', '2026-08-16', '2026-08-18 19:15:05', '2026-08-18 19:15:05');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('6', '5', '1', '350', 'Expense', 'Groceries Audit', '2026-08-16', '2026-08-18 19:15:05', '2026-08-18 19:15:05');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('7', '5', '1', '80', 'Expense', 'Spent 80 dollars on groceries yesterday', '2026-08-17', '2026-08-18 19:15:05', '2026-08-18 19:15:05');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('8', '6', '9', '4500', 'Income', 'Monthly Salary Audit', '2026-08-16', '2026-08-18 19:16:17', '2026-08-18 19:16:17');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('9', '6', '1', '350', 'Expense', 'Groceries Audit', '2026-08-16', '2026-08-18 19:16:17', '2026-08-18 19:16:17');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('10', '6', '1', '80', 'Expense', 'Spent 80 dollars on groceries yesterday', '2026-08-17', '2026-08-18 19:16:17', '2026-08-18 19:16:17');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('11', '4', '1', '500', 'Expense', 'I spent 500 on food', '2026-08-18', '2026-08-18 19:41:57', '2026-08-18 19:41:57');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('12', '7', '9', '4500', 'Income', 'Monthly Salary Audit', '2026-08-16', '2026-08-18 19:42:03', '2026-08-18 19:42:03');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('13', '7', '1', '350', 'Expense', 'Groceries Audit', '2026-08-16', '2026-08-18 19:42:03', '2026-08-18 19:42:03');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('14', '7', '1', '80', 'Expense', 'Spent 80 dollars on groceries yesterday', '2026-08-17', '2026-08-18 19:42:03', '2026-08-18 19:42:03');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('15', '4', '1', '500', 'Expense', 'I spent 500 on food', '2026-08-18', '2026-08-18 19:56:57', '2026-08-18 19:56:57');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('16', '8', '9', '4500', 'Income', 'Monthly Salary Audit', '2026-08-16', '2026-08-18 19:57:05', '2026-08-18 19:57:05');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('17', '8', '1', '350', 'Expense', 'Groceries Audit', '2026-08-16', '2026-08-18 19:57:05', '2026-08-18 19:57:05');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('18', '8', '1', '80', 'Expense', 'Spent 80 dollars on groceries yesterday', '2026-08-17', '2026-08-18 19:57:05', '2026-08-18 19:57:05');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('19', '4', '1', '500', 'Expense', 'I spent 500 on food', '2026-08-18', '2026-08-18 19:58:51', '2026-08-18 19:58:51');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('20', '4', '1', '500', 'Expense', 'I spent 500 on food', '2026-08-18', '2026-08-18 20:02:04', '2026-08-18 20:02:04');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('21', '9', '9', '4500', 'Income', 'Monthly Salary Audit', '2026-08-16', '2026-08-18 20:02:10', '2026-08-18 20:02:10');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('22', '9', '1', '350', 'Expense', 'Groceries Audit', '2026-08-16', '2026-08-18 20:02:10', '2026-08-18 20:02:10');
INSERT INTO transactions (transaction_id, user_id, category_id, amount, type, description, transaction_date, created_at, updated_at) VALUES ('23', '9', '1', '80', 'Expense', 'Spent 80 dollars on groceries yesterday', '2026-08-17', '2026-08-18 20:02:10', '2026-08-18 20:02:10');

-- Table: budgets
INSERT INTO budgets (budget_id, user_id, month, year, budget_limit) VALUES ('1', '1', '8', '2026', '3000');
INSERT INTO budgets (budget_id, user_id, month, year, budget_limit) VALUES ('2', '5', '8', '2026', '2000');
INSERT INTO budgets (budget_id, user_id, month, year, budget_limit) VALUES ('3', '6', '8', '2026', '2000');
INSERT INTO budgets (budget_id, user_id, month, year, budget_limit) VALUES ('4', '7', '8', '2026', '2000');
INSERT INTO budgets (budget_id, user_id, month, year, budget_limit) VALUES ('5', '8', '8', '2026', '2000');
INSERT INTO budgets (budget_id, user_id, month, year, budget_limit) VALUES ('6', '9', '8', '2026', '2000');

-- Table: ai_insights
INSERT INTO ai_insights (insight_id, user_id, message, insight_type, created_at) VALUES ('3', '5', 'Excellent work! Your savings rate is 92% this month.', 'Achievement', '2026-08-18 19:15:05');
INSERT INTO ai_insights (insight_id, user_id, message, insight_type, created_at) VALUES ('4', '5', 'Spending concentration: 100% of your expenses went to Food.', 'Warning', '2026-08-18 19:15:05');
INSERT INTO ai_insights (insight_id, user_id, message, insight_type, created_at) VALUES ('7', '6', 'Excellent work! Your savings rate is 92% this month.', 'Achievement', '2026-08-18 19:16:17');
INSERT INTO ai_insights (insight_id, user_id, message, insight_type, created_at) VALUES ('8', '6', 'Spending concentration: 100% of your expenses went to Food.', 'Warning', '2026-08-18 19:16:17');
INSERT INTO ai_insights (insight_id, user_id, message, insight_type, created_at) VALUES ('11', '7', '{"type":"Achievement","category":"Achievement","title":"Budget Discipline on Track","message":"You have used only 0% of your monthly budget with 12 days left. Great financial discipline!","impact":"Positive","icon":"fa-circle-check"}', 'Achievement', '2026-08-18 19:42:03');
INSERT INTO ai_insights (insight_id, user_id, message, insight_type, created_at) VALUES ('14', '8', '{"type":"Achievement","category":"Achievement","title":"Budget Discipline on Track","message":"You have used only 0% of your monthly budget with 12 days left. Great financial discipline!","impact":"Positive","icon":"fa-circle-check"}', 'Achievement', '2026-08-18 19:57:05');
INSERT INTO ai_insights (insight_id, user_id, message, insight_type, created_at) VALUES ('16', '4', '{"type":"Recommendation","category":"Recommendation","title":"Financial Health Stable","message":"Your transactions are balanced. Continue tracking regular expenses to receive deeper AI recommendations.","impact":"Neutral","icon":"fa-chart-line"}', 'Recommendation', '2026-08-18 20:02:04');
INSERT INTO ai_insights (insight_id, user_id, message, insight_type, created_at) VALUES ('18', '9', '{"type":"Achievement","category":"Achievement","title":"Budget Discipline on Track","message":"You have used only 0% of your monthly budget with 12 days left. Great financial discipline!","impact":"Positive","icon":"fa-circle-check"}', 'Achievement', '2026-08-18 20:02:10');

-- Table: voice_entries
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('1', '5', 'Spent 80 dollars on groceries yesterday', '80', 'Expense', 'Other Expense', '2026-08-18 19:15:05');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('2', '6', 'Spent 80 dollars on groceries yesterday', '80', 'Expense', 'Other Expense', '2026-08-18 19:16:17');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('3', '4', 'What is my remaining budget?', '0', 'Query Budget', 'Budget', '2026-08-18 19:41:57');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('4', '4', 'How much did I spend on food?', '0', 'Category Query', 'Food', '2026-08-18 19:41:57');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('5', '4', 'I spent 500 on food', '500', 'Expense', 'Food', '2026-08-18 19:41:57');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('6', '7', 'Spent 80 dollars on groceries yesterday', '80', 'Expense', 'Food', '2026-08-18 19:42:03');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('7', '4', 'What is my remaining budget?', '0', 'Query Budget', 'Budget', '2026-08-18 19:56:57');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('8', '4', 'How much did I spend on food?', '0', 'Category Query', 'Food', '2026-08-18 19:56:57');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('9', '4', 'I spent 500 on food', '500', 'Expense', 'Food', '2026-08-18 19:56:57');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('10', '8', 'Spent 80 dollars on groceries yesterday', '80', 'Expense', 'Food', '2026-08-18 19:57:05');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('11', '4', 'What is my remaining budget?', '0', 'Query Budget', 'Budget', '2026-08-18 19:58:51');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('12', '4', 'How much did I spend on food?', '0', 'Category Query', 'Food', '2026-08-18 19:58:51');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('13', '4', 'I spent 500 on food', '500', 'Expense', 'Food', '2026-08-18 19:58:51');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('14', '4', 'What is my remaining budget?', '0', 'Query Budget', 'Budget', '2026-08-18 20:02:04');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('15', '4', 'How much did I spend on food?', '0', 'Category Query', 'Food', '2026-08-18 20:02:04');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('16', '4', 'I spent 500 on food', '500', 'Expense', 'Food', '2026-08-18 20:02:04');
INSERT INTO voice_entries (voice_id, user_id, voice_text, parsed_amount, parsed_type, parsed_category, created_at) VALUES ('17', '9', 'Spent 80 dollars on groceries yesterday', '80', 'Expense', 'Food', '2026-08-18 20:02:10');

