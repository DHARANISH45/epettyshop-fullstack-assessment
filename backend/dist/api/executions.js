"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executionRouter = void 0;
const express_1 = require("express");
const prisma_1 = __importDefault(require("../models/prisma"));
const executionEngine_1 = require("../services/executionEngine");
exports.executionRouter = (0, express_1.Router)();
const getTenantId = (req) => req.tenantId;
// POST /execute - Trigger workflow execution
exports.executionRouter.post('/execute', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const { event, data } = req.body;
        if (!event || !data) {
            res.status(400).json({ error: 'event and data are required' });
            return;
        }
        const results = await executionEngine_1.executionEngine.executeEvent(tenantId, event, data);
        res.json({
            success: true,
            results,
        });
    }
    catch (error) {
        if (error.message?.includes('No active workflows found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        next(error);
    }
});
// GET /executions - List executions for tenant
exports.executionRouter.get('/executions', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const { workflow_id, status, limit = '20', offset = '0' } = req.query;
        const where = { tenant_id: tenantId };
        if (workflow_id)
            where.workflow_id = workflow_id;
        if (status)
            where.status = status;
        const [executions, total] = await Promise.all([
            prisma_1.default.execution.findMany({
                where,
                include: {
                    workflow: {
                        select: {
                            name: true,
                            trigger_event: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                take: Math.min(parseInt(limit), 100),
                skip: parseInt(offset),
            }),
            prisma_1.default.execution.count({ where }),
        ]);
        res.json({
            executions,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /executions/:id - Get single execution with full logs
exports.executionRouter.get('/executions/:id', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const id = req.params.id;
        const execution = await prisma_1.default.execution.findFirst({
            where: { id: id, tenant_id: tenantId },
            include: {
                workflow: {
                    select: {
                        name: true,
                        trigger_event: true,
                    },
                },
            },
        });
        if (!execution) {
            res.status(404).json({ error: 'Execution not found' });
            return;
        }
        res.json(execution);
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=executions.js.map