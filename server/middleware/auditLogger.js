const AuditLog = require('../models/AuditLog');

const auditLogger = (actionDescription) => {
    return async (req, res, next) => {
        // We only care about successful actions.
        // We will hook into res.send/res.json to log after success
        const originalSend = res.send;
        
        res.send = function (body) {
            res.send = originalSend;
            
            // If the response is successful (2xx), log the action
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Extract admin info from JWT payload (req.admin is set by verifyAdminToken)
                const adminUsername = req.admin?.adminEmail || 'Admin';
                
                // Get IP
                const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';

                // Try to extract useful info from request body/params
                let details = actionDescription;
                if (req.params.id) {
                    details += ` (ID: ${req.params.id})`;
                }

                AuditLog.create({
                    adminUsername,
                    action: actionDescription,
                    details: details,
                    ipAddress
                }).catch(err => console.error('Audit Log Error:', err));
            }

            return res.send(body);
        };
        next();
    };
};

module.exports = auditLogger;
