"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = tenantMiddleware;
/**
 * Tenant isolation middleware.
 * Extracts tenant_id from the X-Tenant-ID header.
 * In production, this would be derived from JWT claims.
 */
function tenantMiddleware(req, res, next) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        res.status(401).json({
            error: 'Missing X-Tenant-ID header',
            message: 'All API requests must include a valid X-Tenant-ID header.',
        });
        return;
    }
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
        res.status(400).json({
            error: 'Invalid X-Tenant-ID format',
            message: 'X-Tenant-ID must be a valid UUID.',
        });
        return;
    }
    // Attach tenant_id to request for downstream use
    req.tenantId = tenantId;
    next();
}
//# sourceMappingURL=tenant.js.map