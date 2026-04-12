import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../models/prisma';

export const stepRouter = Router();

const getTenantId = (req: Request): string => (req as any).tenantId;

// POST /steps - Create step
stepRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { workflow_id, name, step_type, step_order, metadata } = req.body;

    if (!workflow_id || !name || !step_type) {
      res.status(400).json({ error: 'workflow_id, name, and step_type are required' });
      return;
    }

    // Verify workflow belongs to tenant
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflow_id, tenant_id: tenantId },
    });

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    // Auto-calculate step_order if not provided
    let order = step_order;
    if (order === undefined || order === null) {
      const lastStep = await prisma.step.findFirst({
        where: { workflow_id },
        orderBy: { step_order: 'desc' },
      });
      order = lastStep ? lastStep.step_order + 1 : 0;
    }

    const step = await prisma.step.create({
      data: {
        workflow_id,
        name,
        step_type,
        step_order: order,
        metadata: metadata || {},
      },
      include: {
        rules: {
          orderBy: { priority: 'asc' },
        },
      },
    });

    res.status(201).json(step);
  } catch (error) {
    next(error);
  }
});

// PUT /steps/:id - Update step
stepRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const id = req.params.id as string;
    const { name, step_type, step_order, metadata } = req.body;

    // Verify step belongs to tenant's workflow
    const existing = await prisma.step.findFirst({
      where: {
        id,
        workflow: { tenant_id: tenantId },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    const step = await prisma.step.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(step_type !== undefined && { step_type }),
        ...(step_order !== undefined && { step_order }),
        ...(metadata !== undefined && { metadata }),
      },
      include: {
        rules: {
          orderBy: { priority: 'asc' },
        },
      },
    });

    res.json(step);
  } catch (error) {
    next(error);
  }
});

// DELETE /steps/:id - Delete step
stepRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const id = req.params.id as string;

    const existing = await prisma.step.findFirst({
      where: {
        id,
        workflow: { tenant_id: tenantId },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    await prisma.step.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
