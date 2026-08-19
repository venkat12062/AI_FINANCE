const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Load environment config
const env = require('./config/env');
const logger = require('./utils/logger');

// Initialize DB connection pool & initialization script
const initDatabase = require('./database/database-init');

// Middlewares
const notFoundHandler = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Routes
const systemRoutes = require('./routes/systemRoutes');
const databaseRoutes = require('./routes/database');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiRoutes = require('./routes/aiRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const path = require('path');

const app = express();
const PORT = env.PORT || 5000;

// Security and utility middlewares
const globalLimiter = require('./middleware/rateLimiter');
const sanitizeInput = require('./middleware/sanitizeInput');
const requestTimer = require('./middleware/requestTimer');
const fileLogger = require('./utils/fileLogger');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            workerSrc: ["'self'"],
            manifestSrc: ["'self'"],
        }
    },
    crossOriginEmbedderPolicy: false,
})); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10kb' })); // Parse JSON body, limit size
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parse URL-encoded body

app.use(requestTimer); // Add X-Response-Time header
if (env.NODE_ENV !== 'test') {
    app.use(globalLimiter); // Apply rate limiting to all requests
    // sanitizeInput disabled - xss-clean & hpp are incompatible with Express 5
    app.use(morgan(':method :url :date[clf] :status :response-time ms', { stream: fileLogger.accessStream }));
}

const backupRoutes = require('./routes/backupRoutes');

// Define Routes
app.use('/api/system', healthRoutes);
app.use('/api', systemRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/insights', aiRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/backups', backupRoutes);

// Static file serving for uploads and frontend PWA
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Explicit fallback: serve index.html only for web page navigations, NOT for missing static assets
app.get('/{*path}', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    
    // If the request is for a missing static file (.css, .js, .png, etc.), return 404 text so browser does not interpret HTML as CSS/JS
    if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot|map)$/i.test(req.path)) {
        return res.status(404).type('text/plain').send('File not found');
    }
    
    const indexPath = path.join(__dirname, '../frontend', 'index.html');
    res.sendFile(indexPath, err => {
        if (err) next(err);
    });
});

// Not Found Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

if (env.NODE_ENV !== 'test') {
    // Always start the HTTP server immediately so frontend is always accessible
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });

    // Attempt DB initialization in the background (non-blocking)
    initDatabase()
        .then(() => {
            // Initialize DB connection pool
            require('./config/db.js');

            // Start background jobs only if DB is available
            try {
                const backupJob = require('./jobs/backupJob');
                const cleanupJob = require('./jobs/cleanupJob');
                backupJob.start();
                cleanupJob.start();
                logger.info('Background jobs started successfully.');
            } catch (jobErr) {
                logger.error(`Failed to start background jobs: ${jobErr.message}`);
            }
        })
        .catch(error => {
            logger.error(`Database initialization failed: ${error.message}. Server continues running in limited mode.`);
        });
} else {
    // In test environment, do not initialize database
    // The tests will mock the database layer directly
}

module.exports = app;
