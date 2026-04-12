import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../models/prisma';

export const workflowRouter = Router();

// Helper to get tenant ID
const getTenantId = (req: Request): string => (req as any).tenantId;

// POST /workflows - Create workflow
workflowRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { name, trigger_event, is_active = true } = req.body;

    if (!name || !trigger_event) {
      res.status(400).json({ error: 'name and trigger_event are required' });
      return;
    }

    const workflow = await prisma.workflow.create({
      data: {
        tenant_id: tenantId,
        name,
        trigger_event,
        is_active,
      },
    });

    res.status(201).json(workflow);
  } catch (error) {
    next(error);
  }
});

// GET /workflows - List all workflows for tenant
workflowRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { trigger_event, is_active } = req.query;

    const where: any = { tenant_id: tenantId };
    if (trigger_event) where.trigger_event = trigger_event as string;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const workflows = await prisma.workflow.findMany({
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
  } catch (error) {
    next(error);
  }
});

// GET /workflows/:id - Get single workflow
workflowRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const id = req.params.id as string;

    const workflow = await prisma.workflow.findFirst({
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
  } catch (error) {
    next(error);
  }
});

// PUT /workflows/:id - Update workflow
workflowRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const id = req.params.id as string;
    const { name, trigger_event, is_active } = req.body;

    // Verify ownership
    const existing = await prisma.workflow.findFirst({
      where: { id, tenant_id: tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    const workflow = await prisma.workflow.update({
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
  } catch (error) {
    next(error);
  }
});

// DELETE /workflows/:id - Delete workflow
workflowRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const id = req.params.id as string;

    const existing = await prisma.workflow.findFirst({
      where: { id: id as string, tenant_id: tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    await prisma.workflow.delete({ where: { id: id as string } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
