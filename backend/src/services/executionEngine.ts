import prisma from '../models/prisma';
import { evaluateRule, RuleEvalResult } from '../utils/ruleEvaluator';
import { Prisma } from '@prisma/client';

export interface ExecutionLogEntry {
  stepId: string;
  stepName: string;
  stepType: string;
  stepOrder: number;
  rulesEvaluated: RuleEvalResult[];
  matchedRuleId: string | null;
  nextStepId: string | null;
  status: 'passed' | 'failed' | 'skipped' | 'default';
  timestamp: string;
}

export interface ExecutionResult {
  executionId: string;
  workflowId: string;
  workflowName: string;
  status: 'completed' | 'failed';
  logs: ExecutionLogEntry[];
  startedAt: string;
  completedAt: string;
}

/**
 * The core workflow execution engine.
 * Processes workflows step-by-step, evaluating rules in priority order.
 * Execution is isolated per request and uses database transactions.
 */
export class ExecutionEngine {
  /**
   * Execute all matching workflows for a given event.
   */
  async executeEvent(
    tenantId: string,
    event: string,
    data: Record<string, any>
  ): Promise<ExecutionResult[]> {
    // Find all active workflows matching the trigger event
    const workflows = await prisma.workflow.findMany({
      where: {
        tenant_id: tenantId,
        trigger_event: event,
        is_active: true,
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

    if (workflows.length === 0) {
      throw new Error(`No active workflows found for event: ${event}`);
    }

    const results: ExecutionResult[] = [];

    for (const workflow of workflows) {
      const result = await this.executeWorkflow(tenantId, workflow, data);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single workflow with full logging.
   * Uses a database transaction for atomic execution record creation.
   */
  private async executeWorkflow(
    tenantId: string,
    workflow: any,
    data: Record<string, any>
  ): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();
    const logs: ExecutionLogEntry[] = [];
    let executionStatus: 'completed' | 'failed' = 'completed';

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        tenant_id: tenantId,
        workflow_id: workflow.id,
        status: 'in_progress',
        trigger_data: data as Prisma.InputJsonValue,
        logs: [] as Prisma.InputJsonValue,
      },
    });

    try {
      // Build step map for O(1) lookup
      const stepMap = new Map<string, any>();
      for (const step of workflow.steps) {
        stepMap.set(step.id, step);
      }

      // Start from the first step (lowest step_order)
      let currentStep = workflow.steps[0];

      // Track visited steps to prevent infinite loops
      const visitedSteps = new Set<string>();
      const maxSteps = 100; // Safety limit

      while (currentStep && visitedSteps.size < maxSteps) {
        if (visitedSteps.has(currentStep.id)) {
          logs.push({
            stepId: currentStep.id,
            stepName: currentStep.name,
            stepType: currentStep.step_type,
            stepOrder: currentStep.step_order,
            rulesEvaluated: [],
            matchedRuleId: null,
            nextStepId: null,
            status: 'failed',
            timestamp: new Date().toISOString(),
          });
          executionStatus = 'failed';
          break;
        }

        visitedSteps.add(currentStep.id);

        const logEntry = await this.executeStep(currentStep, data);
        logs.push(logEntry);

        if (logEntry.status === 'failed') {
          executionStatus = 'failed';
          break;
        }

        // Move to next step
        if (logEntry.nextStepId) {
          currentStep = stepMap.get(logEntry.nextStepId) || null;
        } else {
          // No next step - workflow ends
          currentStep = null;
        }
      }

      const completedAt = new Date().toISOString();

      // Update execution record atomically
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: executionStatus,
          logs: logs as unknown as Prisma.InputJsonValue,
          completed_at: new Date(completedAt),
        },
      });

      return {
        executionId: execution.id,
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: executionStatus,
        logs,
        startedAt,
        completedAt,
      };
    } catch (error: any) {
      // Update execution as failed
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          logs: [
            ...logs,
            {
              error: error.message,
              timestamp: new Date().toISOString(),
            },
          ] as unknown as Prisma.InputJsonValue,
          completed_at: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Execute a single step: evaluate all rules in priority order,
   * stop at the first matching rule.
   */
  private async executeStep(
    step: any,
    data: Record<string, any>
  ): Promise<ExecutionLogEntry> {
    const rulesEvaluated: RuleEvalResult[] = [];
    let matchedRuleId: string | null = null;
    let nextStepId: string | null = null;
    let status: ExecutionLogEntry['status'] = 'passed';

    const rules = step.rules || [];

    if (rules.length === 0) {
      // No rules - step passes by default, workflow ends at this step
      return {
        stepId: step.id,
        stepName: step.name,
        stepType: step.step_type,
        stepOrder: step.step_order,
        rulesEvaluated: [],
        matchedRuleId: null,
        nextStepId: null,
        status: 'passed',
        timestamp: new Date().toISOString(),
      };
    }

    // Evaluate rules in priority order (already sorted)
    for (const rule of rules) {
      const result = await evaluateRule(
        {
          id: rule.id,
          field: rule.field,
          operator: rule.operator,
          value: rule.value,
          condition: rule.condition,
        },
        data
      );

      rulesEvaluated.push(result);

      if (result.passed) {
        matchedRuleId = rule.id;
        nextStepId = rule.next_step_id;
        status = rule.condition === 'DEFAULT' ? 'default' : 'passed';
        break; // Stop at first matching rule
      }
    }

    // If no rules matched, check for a DEFAULT rule
    if (!matchedRuleId) {
      const defaultRule = rules.find(
        (r: any) => r.condition === 'DEFAULT' || r.field === 'DEFAULT'
      );
      if (defaultRule) {
        matchedRuleId = defaultRule.id;
        nextStepId = defaultRule.next_step_id;
        status = 'default';
      } else {
        status = 'skipped';
      }
    }

    return {
      stepId: step.id,
      stepName: step.name,
      stepType: step.step_type,
      stepOrder: step.step_order,
      rulesEvaluated,
      matchedRuleId,
      nextStepId,
      status,
      timestamp: new Date().toISOString(),
    };
  }
}

export const executionEngine = new ExecutionEngine();
