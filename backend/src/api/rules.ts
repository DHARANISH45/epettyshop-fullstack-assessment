import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../models/prisma';
import { buildCondition } from '../utils/ruleEvaluator';

export const ruleRouter = Router();

const getTenantId = (req: Request): string => (req as any).tenantId;

// POST /rules - Create rule
ruleRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { step_id, field, operator, value, next_step_id, priority } = req.body;

    if (!step_id || !field || !operator || value === undefined) {
      res.status(400).json({ error: 'step_id, field, operator, and value are required' });
      return;
    }

    // Verify step belongs to tenant's workflow
    const step = await prisma.step.findFirst({
      where: {
        id: step_id,
        workflow: { tenant_id: tenantId },
      },
    });

    if (!step) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    // If next_step_id provided, verify it exists in the same workflow
    if (next_step_id) {
      const nextStep = await prisma.step.findFirst({
        where: {
          id: next_step_id,
          workflow_id: step.workflow_id,
        },
      });

      if (!nextStep) {
        res.status(400).json({ error: 'next_step_id must reference a step in the same workflow' });
        return;
      }
    }

    // Build JEXL condition from structured components
    const condition = field === 'DEFAULT' ? 'DEFAULT' : buildCondition(field, operator, value);

    // Auto-calculate priority if not provided
    let rulePriority = priority;
    if (rulePriority === undefined || rulePriority === null) {
      const lastRule = await prisma.rule.findFirst({
        where: { step_id },
        orderBy: { priority: 'desc' },
      });
      rulePriority = lastRule ? lastRule.priority + 1 : 0;
    }

    const rule = await prisma.rule.create({
      data: {
        step_id,
        field,
        operator,
        value: String(value),
        condition,
        next_step_id: next_step_id || null,
        priority: rulePriority,
      },
    });

    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

// PUT /rules/:id - Update rule
ruleRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const id = req.params.id as string;
    const { field, operator, value, next_step_id, priority } = req.body;

    // Verify rule belongs to tenant's workflow
    const existing = await prisma.rule.findFirst({
      where: {
        id,
        step: {
          workflow: { tenant_id: tenantId },
        },
      },
      include: {
        step: true,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }

    // Rebuild condition if field/operator/value changed
    const newField = field !== undefined ? field : existing.field;
    const newOperator = operator !== undefined ? operator : existing.operator;
    const newValue = value !== undefined ? String(value) : existing.value;
    const condition = newField === 'DEFAULT' ? 'DEFAULT' : buildCondition(newField, newOperator, newValue);

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        ...(field !== undefined && { field: newField }),
        ...(operator !== undefined && { operator: newOperator }),
        ...(value !== undefined && { value: newValue }),
        condition,
        ...(next_step_id !== undefined && { next_step_id: next_step_id || null }),
        ...(priority !== undefined && { priority }),
      },
    });

    res.json(rule);
  } catch (error) {
    next(error);
  }
});

// DELETE /rules/:id - Delete rule
ruleRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const id = req.params.id as string;

    const existing = await prisma.rule.findFirst({
      where: {
        id,
        step: {
          workflow: { tenant_id: tenantId },
        },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }

    await prisma.rule.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
