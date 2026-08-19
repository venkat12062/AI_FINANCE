# Interview Guide

Use these scripts and answers during tech interviews to sound like a Senior Backend Engineer.

## Elevator Pitches

### 2 Minute Explanation (The Intro)
"For my most recent project, I built a comprehensive AI-Powered Finance Manager. It's a full-stack Node.js and Express application backed by a normalized MySQL database. Beyond standard CRUD operations for tracking income and budgets, I engineered automation tools to eliminate manual data entry. Specifically, I integrated Tesseract OCR to parse physical receipts and the Web Speech API to allow users to log expenses via natural language. I also wrote a custom algorithmic AI engine that calculates financial health scores and sends critical budget alerts. I ensured the API was production-ready by implementing strict JWT stateless auth, global error handling, and XSS/Rate Limiting security layers."

### 5 Minute Explanation (The Architectural Overview)
"I designed this system entirely from scratch using an MVC-style controller-service-route architecture to keep the codebase highly maintainable. The stack revolves around Node.js and MySQL. The most interesting challenge was building the AI Insights Engine without relying on costly external APIs like OpenAI. I wrote an algorithmic analyzer that aggregates a user's trailing 30-day transactions and calculates spending velocities against their fixed monthly budget targets, returning mathematically generated suggestions. 
To optimize performance, I injected an LRU-based memory cache on these heavy analytical endpoints, which cut response latency by 80%. On the security side, I engineered custom Object-Oriented Error classes to guarantee identical JSON response schemas for the frontend, and bolted down the perimeter with Express-Rate-Limit and HTTP Parameter Pollution defenses. The entire backend is unit tested with Jest and containerized with Docker for immediate VPS deployment."

## Common Interview Questions

### Why did you use MySQL instead of MongoDB?
*Answer:* "Personal finance requires absolute consistency. Transactions inherently belong to Users and Categories, forming strict relationships. I needed the ACID compliance and native mathematical aggregations (like `SUM()` and `AVG()`) that SQL provides. Attempting this in NoSQL would require messy multi-document updates and slow Node.js-side array mapping."

### Why JWT instead of Session Cookies?
*Answer:* "Statelessness. If this app scales to multiple backend Node instances behind a load balancer, standard session cookies would require "sticky sessions" or an external Redis store just to know who is logged in. With JWT, the authorization data is cryptographically signed inside the token itself, allowing any server to independently verify the user's identity."

### How did you handle OCR (Receipt Scanning)?
*Answer:* "I used `multer` to safely accept multipart/form-data image uploads. The image path is then passed into `Tesseract.js` which natively executes Optical Character Recognition on a separate worker thread so it doesn't block the Node event loop. Once I have the raw text blob, I use regular expressions to parse out the largest currency number and guess the category based on keyword matching."

### How did you handle Voice Commands?
*Answer:* "The frontend utilizes the HTML5 Web Speech API to capture audio and translate it to a string. The backend receives this string and runs a natural language parsing algorithm. It searches for directive verbs (e.g., 'spent' triggers Expense, 'received' triggers Income) and uses regex to extract the numeric amount, mapping it automatically to the database."

### How does the Caching work?
*Answer:* "Analytical queries (like calculating the Dashboard or running the AI insights) are very CPU/Database intensive. I implemented an LRU cache mapping user IDs to their computed results with a strict 5-minute Time-To-Live (TTL). If a user refreshes the dashboard, it instantly returns the payload from RAM rather than recalculating the entire SQL transaction history."

### How did you secure the application?
*Answer:* "Multiple layers. At the network boundary, `express-rate-limit` blocks IPs spamming requests. At the payload level, `xss-clean` and `hpp` strip executable scripts and duplicate query keys. At the database level, all SQL statements use parameterized prepared queries (`?`) to completely eliminate SQL injection. Passwords are salted and hashed using `bcrypt`."
