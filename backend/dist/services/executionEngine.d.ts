import { RuleEvalResult } from '../utils/ruleEvaluator';
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
export declare class ExecutionEngine {
    /**
     * Execute all matching workflows for a given event.
     */
    executeEvent(tenantId: string, event: string, data: Record<string, any>): Promise<ExecutionResult[]>;
    /**
     * Execute a single workflow with full logging.
     * Uses a database transaction for atomic execution record creation.
     */
    private executeWorkflow;
    /**
     * Execute a single step: evaluate all rules in priority order,
     * stop at the first matching rule.
     */
    private executeStep;
}
export declare const executionEngine: ExecutionEngine;
//# sourceMappingURL=executionEngine.d.ts.map