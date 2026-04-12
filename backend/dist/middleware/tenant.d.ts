import { Request, Response, NextFunction } from 'express';
/**
 * Tenant isolation middleware.
 * Extracts tenant_id from the X-Tenant-ID header.
 * In production, this would be derived from JWT claims.
 */
export declare function tenantMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=tenant.d.ts.map