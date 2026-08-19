/**
 * Middleware to ensure users only access their own resources.
 * This checks if req.user.userId matches the requested resource's owner ID.
 * To be used in future modules (e.g. transactions, budgets, receipts, insights).
 */
const authorizeOwnership = (resourceUserIdSelector) => {
    return (req, res, next) => {
        // resourceUserIdSelector is a function that extracts the expected owner ID from the request (e.g., req.params.userId or from a DB query).
        const expectedOwnerId = resourceUserIdSelector(req);
        
        // If the expected owner doesn't match the authenticated user's ID
        if (expectedOwnerId && req.user.userId !== parseInt(expectedOwnerId, 10)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to access this resource"
            });
        }
        
        next();
    };
};

module.exports = {
    authorizeOwnership
};
