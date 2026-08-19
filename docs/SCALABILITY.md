# Scalability Guide

When discussing system design in interviews, you must know how to scale this specific application.

## 10,000 Users
At 10k users, the primary bottleneck is database read queries, especially for the dashboard and reports.
- **Vertical Scaling**: Upgrade the VPS instance RAM and CPU.
- **Caching**: We already implemented an in-memory `cache.js`. At 10,000 users, we would migrate this to **Redis** (an external key-value store). Dashboard aggregations run once and serve from Redis for 5 minutes, dropping MySQL CPU load drastically.
- **Uploads**: Move receipt images off the local server disk onto **AWS S3** to prevent filling up the hard drive.

## 100,000 Users
At 100k users, a single Node.js process and a single database will choke.
- **Horizontal Scaling**: Spin up 3-5 identical Node.js backend servers running concurrently.
- **Load Balancer**: Put an NGINX or AWS ELB load balancer in front of the backends. Since we used stateless **JWTs** instead of sessions, any request can hit any server interchangeably.
- **Database Replication**: Set up MySQL Master-Slave replication. All POST/PUT/DELETE requests (writes) hit the Master DB. All GET requests (Dashboard, Reports) read from the Slave DBs. This splits the load securely.

## 1,000,000 Users
At 1M users, OCR processing and AI Insights will cause Node.js event loop blocking if executed synchronously.
- **Microservices**: Break the application apart. The OCR engine and AI engine become separate Python or Go microservices. 
- **Message Queues**: Implement **RabbitMQ** or **Apache Kafka**. When a user uploads a receipt, the main API instantly returns "Processing...". The image is dumped to a Queue. The OCR microservice reads the queue at its own pace, processes the image, and updates the database async.
- **Database Sharding**: A single MySQL master can no longer handle the write volume. We partition (shard) the database by `user_id` so that users 1-500k live on Database A, and users 500k-1M live on Database B.
- **CDN (Content Delivery Network)**: Serve all static assets, frontend files, and receipt images through Cloudflare or AWS CloudFront to reduce latency globally.
