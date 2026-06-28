/**
 * WAF (Web Application Firewall) Middleware
 * Detects and blocks malicious requests before they reach application logic
 * 
 * Protections:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - Path Traversal
 * - Command Injection
 * - Malicious User-Agents (scanners/bots)
 * - HTTP Method Validation
 * - Request Size Limits
 */

const BannedIP = require('../models/BannedIP');

// ==================== ATTACK PATTERN DEFINITIONS ====================

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
    /(\b(union)\b\s+\b(select|all)\b)/i,
    /(\b(select)\b\s+.+\b(from)\b)/i,
    /(\b(insert)\b\s+\b(into)\b)/i,
    /(\b(update)\b\s+.+\b(set)\b)/i,
    /(\b(delete)\b\s+\b(from)\b)/i,
    /(\b(drop)\b\s+\b(table|database|column|index)\b)/i,
    /(\b(alter)\b\s+\b(table)\b)/i,
    /(\b(create)\b\s+\b(table|database)\b)/i,
    /(\b(truncate)\b\s+\b(table)\b)/i,
    /((\bor\b|\band\b)\s+[\d'"]+=[\d'"]+)/i,          // OR 1=1, AND '1'='1'
    /(--\s|#\s|\/\*)/,                                   // SQL comments
    /(\b(exec|execute|xp_|sp_)\b)/i,                    // Stored procedures
    /(\b(waitfor)\b\s+\b(delay)\b)/i,                   // Time-based injection
    /(\b(benchmark)\s*\()/i,                             // MySQL benchmark
    /(\b(load_file|into\s+outfile|into\s+dumpfile)\b)/i, // File operations
    /(\b(information_schema|sys\.)\b)/i,                 // Schema enumeration
    /(;\s*(drop|delete|update|insert|alter|create))/i,   // Stacked queries
    /(';\s*--)/i,                                        // Comment after injection
    /(\b(char|nchar|varchar|nvarchar)\s*\()/i,           // Character encoding bypass
    /(\b(concat|group_concat|concat_ws)\s*\()/i          // String concatenation
];

// XSS (Cross-Site Scripting) patterns
const XSS_PATTERNS = [
    /(<\s*script\b[^>]*>)/i,                 // <script> tags
    /(<\s*\/\s*script\s*>)/i,                // </script> tags
    /(on\w+\s*=\s*["'][^"']*["'])/i,         // Event handlers: onclick="", onerror=""
    /(on\w+\s*=\s*[^\s>]+)/i,                // Unquoted event handlers
    /(javascript\s*:)/i,                      // javascript: protocol
    /(vbscript\s*:)/i,                        // vbscript: protocol
    /(<\s*iframe\b)/i,                        // iframe injection
    /(<\s*embed\b)/i,                         // embed injection
    /(<\s*object\b)/i,                        // object injection
    /(<\s*applet\b)/i,                        // applet injection
    /(<\s*form\b)/i,                          // form injection
    /(<\s*img\b[^>]*\bon\w+\s*=)/i,          // img with event handlers
    /(document\s*\.\s*(cookie|write|domain))/i, // DOM manipulation
    /(window\s*\.\s*(location|open))/i,       // Window manipulation
    /(eval\s*\()/i,                           // eval()
    /(expression\s*\()/i,                     // CSS expression()
    /(url\s*\(\s*['"]?\s*javascript)/i,       // CSS url(javascript:)
    /(<\s*svg\b[^>]*\bon\w+)/i,              // SVG with events
    /(<\s*math\b)/i,                          // MathML injection
    /(fromCharCode)/i,                        // String.fromCharCode
    /(&#\d+;|&#x[\da-f]+;)/i                 // HTML entity encoding attacks
];

// Path Traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
    /(\.\.\/|\.\.\\)/,                        // ../ or ..\
    /(\.\.%2[fF]|%2[eE]%2[eE])/,            // URL-encoded traversal
    /(%252[eE]%252[eE])/,                    // Double-encoded
    /(\/etc\/(passwd|shadow|hosts))/i,        // Linux system files
    /(\/proc\/self)/i,                        // Linux proc
    /(\/var\/log)/i,                          // Log files
    /(C:\\Windows|C:\\System32)/i,            // Windows system paths
    /(boot\.ini|win\.ini)/i,                  // Windows config files
    /(\.htaccess|\.htpasswd)/i,              // Apache config
    /(web\.config)/i,                         // IIS config
    /(\.git\/|\.svn\/)/i,                    // Version control
    /(\.env(\.|$))/i                          // Environment files
];

// Command Injection patterns
const COMMAND_INJECTION_PATTERNS = [
    /(;\s*(ls|cat|rm|mv|cp|chmod|chown|wget|curl)\b)/i,  // ; command
    /(\|\s*(ls|cat|rm|mv|cp|chmod|chown|wget|curl)\b)/i,  // | command
    /(`[^`]*`)/,                                           // Backtick execution
    /(\$\([^)]*\))/,                                       // $() execution
    /(\b(system|exec|passthru|popen|proc_open)\s*\()/i,   // PHP functions
    /(\b(os\.system|subprocess|eval|exec)\b)/i,            // Python functions
    /(\b(child_process|spawn|execSync|execFile)\b)/i,      // Node.js process functions
    /(&&\s*(rm|del|format|shutdown|reboot)\b)/i,           // && chained destructive
    /(\|\|\s*(rm|del|format|shutdown|reboot)\b)/i,         // || chained destructive
    /(\b(nc|netcat|ncat)\b\s+-)/i,                         // Netcat
    /(\b(bash|sh|zsh|csh|ksh|powershell|cmd)\b\s+-)/i     // Shell invocation
];

// Malicious User-Agent patterns (scanners, bots, exploit tools)
const MALICIOUS_USER_AGENTS = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /dirbuster/i,
    /gobuster/i,
    /wfuzz/i,
    /hydra/i,
    /burpsuite/i,
    /nessus/i,
    /openvas/i,
    /acunetix/i,
    /w3af/i,
    /arachni/i,
    /skipfish/i,
    /wpscan/i,
    /joomscan/i,
    /havij/i,
    /metasploit/i,
    /zap\/\d/i,          // OWASP ZAP
    /commix/i,
    /whatweb/i,
    /nuclei/i
];

// Allowed HTTP methods
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

// ==================== WAF STATISTICS ====================

const wafStats = {
    totalBlocked: 0,
    sqlInjection: 0,
    xss: 0,
    pathTraversal: 0,
    commandInjection: 0,
    maliciousBot: 0,
    invalidMethod: 0,
    bannedIP: 0,
    recentBlocks: []  // Keep last 100 blocks
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get client IP address
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
}

/**
 * Check a string against an array of regex patterns
 */
function matchesPatterns(str, patterns) {
    if (!str || typeof str !== 'string') return false;
    return patterns.some(pattern => pattern.test(str));
}

/**
 * Deep scan all values in an object
 */
function deepScanObject(obj, patterns) {
    if (!obj) return false;

    if (typeof obj === 'string') {
        return matchesPatterns(obj, patterns);
    }

    if (Array.isArray(obj)) {
        return obj.some(item => deepScanObject(item, patterns));
    }

    if (typeof obj === 'object') {
        // Check keys too (attackers sometimes put payloads in keys)
        for (const key of Object.keys(obj)) {
            if (matchesPatterns(key, patterns)) return true;
            if (deepScanObject(obj[key], patterns)) return true;
        }
    }

    return false;
}

/**
 * Record a WAF block for statistics
 */
function recordBlock(type, ip, path, details = '', req = null) {
    wafStats.totalBlocked++;
    if (wafStats[type] !== undefined) {
        wafStats[type]++;
    }

    const blockRecord = {
        type,
        ip,
        path,
        details,
        timestamp: new Date()
    };

    wafStats.recentBlocks.unshift(blockRecord);
    if (wafStats.recentBlocks.length > 100) {
        wafStats.recentBlocks.pop();
    }
    
    // Save to DB for persistence
    try {
        const SecurityLog = require('../models/SecurityLog');
        SecurityLog.create({
            ip,
            path,
            method: req ? req.method : 'UNKNOWN',
            source: 'WAF',
            reason: type,
            details: details,
            timestamp: new Date()
        }).catch(err => console.error('Error saving WAF SecurityLog:', err));
    } catch (e) {
        // Ignore require errors if DB isn't ready
    }

    console.log(`🛡️ WAF BLOCKED [${type.toUpperCase()}]: ${ip} -> ${path} | ${details}`);
}

// ==================== MAIN WAF MIDDLEWARE ====================

/**
 * WAF middleware - checks every incoming request for malicious patterns
 */
const wafMiddleware = async (req, res, next) => {
    const ip = getClientIP(req);
    const path = req.originalUrl || req.url || '';
    const method = req.method;
    const userAgent = req.headers['user-agent'] || '';

    try {
        // ===== 1. CHECK BANNED IP (from MongoDB) =====
        const ban = await BannedIP.isBanned(ip);
        if (ban) {
            // admin_login_failed bans should ONLY block admin routes, not the entire store
            // WAF/IPS bans (actual attacks) still block everything
            const isAdminRoute = path.startsWith('/api/admin');
            const isAdminLoginBan = ban.reason === 'admin_login_failed';

            if (!isAdminLoginBan || isAdminRoute) {
                recordBlock('bannedIP', ip, path, `Reason: ${ban.reason}`);
                return res.status(403).json({
                    success: false,
                    error: 'Access denied.',
                    banned: true,
                    reason: ban.reason,
                    expiresAt: ban.expiresAt,
                    remainingMs: Math.max(0, new Date(ban.expiresAt).getTime() - Date.now())
                });
            }
            // admin_login_failed on non-admin route → allow through
        }

        // ===== 2. HTTP METHOD VALIDATION =====
        if (!ALLOWED_METHODS.includes(method)) {
            recordBlock('invalidMethod', ip, path, `Method: ${method}`);
            return res.status(405).json({
                success: false,
                error: 'Method not allowed.'
            });
        }

        // ===== 3. MALICIOUS USER-AGENT CHECK =====
        if (matchesPatterns(userAgent, MALICIOUS_USER_AGENTS)) {
            recordBlock('maliciousBot', ip, path, `UA: ${userAgent.substring(0, 50)}`);

            // Auto-ban scanner IPs for 24 hours
            await BannedIP.banIP(ip, 'waf_blocked', 24 * 60 * 60 * 1000, {
                description: `Malicious scanner detected: ${userAgent.substring(0, 100)}`,
                userAgent,
                attackType: 'malicious_bot',
                requestPath: path,
                requestMethod: method
            });

            return res.status(403).json({
                success: false,
                error: 'Access denied.'
            });
        }

        // Build scan targets: URL path + query string + body + headers of interest
        const scanTargets = [
            decodeURIComponent(path),  // URL path (decoded)
            path                        // URL path (raw)
        ];

        // Add query parameters
        if (req.query) {
            Object.values(req.query).forEach(val => {
                if (typeof val === 'string') scanTargets.push(val);
            });
        }

        // For body scanning, exclude sensitive fields (password, otp) on auth routes
        // to prevent false positives (e.g., password containing '=' or backticks)
        const AUTH_ROUTES = ['/api/admin/login', '/api/admin/verify-2fa', '/api/auth/login', '/api/auth/register', '/api/auth/change-password', '/api/user/change-password'];
        const isAuthRoute = AUTH_ROUTES.some(r => path.startsWith(r));
        let bodyToScan = req.body;

        if (isAuthRoute && req.body && typeof req.body === 'object') {
            const { password, otp, currentPassword, newPassword, confirmPassword, ...safeBody } = req.body;
            bodyToScan = safeBody;
        }

        // ===== 4. SQL INJECTION CHECK =====
        if (scanTargets.some(target => matchesPatterns(target, SQL_INJECTION_PATTERNS)) ||
            deepScanObject(bodyToScan, SQL_INJECTION_PATTERNS)) {
            recordBlock('sqlInjection', ip, path);
            return res.status(403).json({
                success: false,
                error: 'Forbidden request detected.'
            });
        }

        // ===== 5. XSS CHECK =====
        if (scanTargets.some(target => matchesPatterns(target, XSS_PATTERNS)) ||
            deepScanObject(bodyToScan, XSS_PATTERNS)) {
            recordBlock('xss', ip, path);
            return res.status(403).json({
                success: false,
                error: 'Forbidden request detected.'
            });
        }

        // ===== 6. PATH TRAVERSAL CHECK =====
        if (scanTargets.some(target => matchesPatterns(target, PATH_TRAVERSAL_PATTERNS))) {
            recordBlock('pathTraversal', ip, path);
            return res.status(403).json({
                success: false,
                error: 'Forbidden request detected.'
            });
        }

        // ===== 7. COMMAND INJECTION CHECK =====
        if (scanTargets.some(target => matchesPatterns(target, COMMAND_INJECTION_PATTERNS)) ||
            deepScanObject(bodyToScan, COMMAND_INJECTION_PATTERNS)) {
            recordBlock('commandInjection', ip, path);
            return res.status(403).json({
                success: false,
                error: 'Forbidden request detected.'
            });
        }

        // All checks passed — proceed
        next();
    } catch (error) {
        // On WAF error, log but don't block legitimate traffic
        console.error('⚠️ WAF Error (allowing request):', error.message);
        next();
    }
};

// ==================== IP BAN CHECK MIDDLEWARE (lightweight) ====================

/**
 * Lightweight IP ban check for admin routes
 * This is separate from the full WAF scan for performance
 */
const checkIPBan = async (req, res, next) => {
    const ip = getClientIP(req);

    try {
        const ban = await BannedIP.isBanned(ip);
        if (ban) {
            const remainingMs = Math.max(0, new Date(ban.expiresAt).getTime() - Date.now());
            console.log(`🚫 Banned IP tried to access admin: ${ip} | Expires: ${ban.expiresAt}`);
            return res.status(403).json({
                success: false,
                error: 'Your IP has been banned due to suspicious activity.',
                banned: true,
                reason: ban.reason,
                expiresAt: ban.expiresAt,
                remainingMs
            });
        }
        next();
    } catch (error) {
        console.error('IP ban check error:', error.message);
        next(); // Don't block on error
    }
};

// ==================== EXPORTS ====================

module.exports = {
    wafMiddleware,
    checkIPBan,
    getClientIP,
    wafStats
};
