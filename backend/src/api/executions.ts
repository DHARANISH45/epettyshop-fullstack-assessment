import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../models/prisma';
import { executionEngine } from '../services/executionEngine';

export const executionRouter = Router();

const getTenantId = (req: Request): string => (req as any).tenantId;

// POST /execute - Trigger workflow execution
executionRouter.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { event, data } = req.body;

    if (!event || !data) {
      res.status(400).json({ error: 'event and data are required' });
      return;
    }

    const results = await executionEngine.executeEvent(tenantId, event, data);
    res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    if (error.message?.includes('No active workflows found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /executions - List executions for tenant
executionRouter.get('/executions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { workflow_id, status, limit = '20', offset = '0' } = req.query;

    const where: any = { tenant_id: tenantId };
    if (workflow_id) where.workflow_id = workflow_id as string;
    if (status) where.status = status as string;

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
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
        take: Math.min(parseInt(limit as string), 100),
        skip: parseInt(offset as string),
      }),
      prisma.execution.count({ where }),
    ]);

    res.json({
      executions,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    next(error);
  }
});

// GET /executions/:id - Get single execution with full logs
executionRouter.get('/executions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const id = req.params.id as string;

    const execution = await prisma.execution.findFirst({
      where: { id: id as string, tenant_id: tenantId },
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
  } catch (error) {
    next(error);
  }
});
