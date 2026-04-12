"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowRouter = void 0;
const express_1 = require("express");
const prisma_1 = __importDefault(require("../models/prisma"));
exports.workflowRouter = (0, express_1.Router)();
// Helper to get tenant ID
const getTenantId = (req) => req.tenantId;
// POST /workflows - Create workflow
exports.workflowRouter.post('/', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const { name, trigger_event, is_active = true } = req.body;
        if (!name || !trigger_event) {
            res.status(400).json({ error: 'name and trigger_event are required' });
            return;
        }
        const workflow = await prisma_1.default.workflow.create({
            data: {
                tenant_id: tenantId,
                name,
                trigger_event,
                is_active,
            },
        });
        res.status(201).json(workflow);
    }
    catch (error) {
        next(error);
    }
});
// GET /workflows - List all workflows for tenant
exports.workflowRouter.get('/', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const { trigger_event, is_active } = req.query;
        const where = { tenant_id: tenantId };
        if (trigger_event)
            where.trigger_event = trigger_event;
        if (is_active !== undefined)
            where.is_active = is_active === 'true';
        const workflows = await prisma_1.default.workflow.findMany({
            where,
            include: {
                steps: {
                    orderBy: { step_order: 'asc' },
                    include: {
                        rules: {
                            orderBy: { priority: 'asc' },
                        },
                    },
                },
                _count: {
                    select: { executions: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        res.json(workflows);
    }
    catch (error) {
        next(error);
    }
});
// GET /workflows/:id - Get single workflow
exports.workflowRouter.get('/:id', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const id = req.params.id;
        const workflow = await prisma_1.default.workflow.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                steps: {
                    orderBy: { step_order: 'asc' },
                    include: {
                        rules: {
                            orderBy: { priority: 'asc' },
                        },
                    },
                },
                executions: {
                    orderBy: { created_at: 'desc' },
                    take: 10,
                },
            },
        });
        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }
        res.json(workflow);
    }
    catch (error) {
        next(error);
    }
});
// PUT /workflows/:id - Update workflow
exports.workflowRouter.put('/:id', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const id = req.params.id;
        const { name, trigger_event, is_active } = req.body;
        // Verify ownership
        const existing = await prisma_1.default.workflow.findFirst({
            where: { id, tenant_id: tenantId },
        });
        if (!existing) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }
        const workflow = await prisma_1.default.workflow.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(trigger_event !== undefined && { trigger_event }),
                ...(is_active !== undefined && { is_active }),
            },
            include: {
                steps: {
                    orderBy: { step_order: 'asc' },
                    include: {
                        rules: {
                            orderBy: { priority: 'asc' },
                        },
                    },
                },
            },
        });
        res.json(workflow);
    }
    catch (error) {
        next(error);
    }
});
// DELETE /workflows/:id - Delete workflow
exports.workflowRouter.delete('/:id', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const id = req.params.id;
        const existing = await prisma_1.default.workflow.findFirst({
            where: { id: id, tenant_id: tenantId },
        });
        if (!existing) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }
        await prisma_1.default.workflow.delete({ where: { id: id } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=workflows.js.map