export interface RuleEvalResult {
    ruleId: string;
    field: string;
    operator: string;
    expectedValue: string;
    actualValue: any;
    condition: string;
    passed: boolean;
    error?: string;
}
/**
 * Build a JEXL expression from structured rule components.
 */
export declare function buildCondition(field: string, operator: string, value: string): string;
/**
 * Evaluate a single JEXL condition against a data context.
 * Returns true/false without throwing.
 */
export declare function evaluateCondition(condition: string, context: Record<string, any>): Promise<{
    passed: boolean;
    error?: string;
}>;
/**
 * Evaluate a structured rule (field, operator, value) against payload data.
 */
export declare function evaluateRule(rule: {
    id: string;
    field: string;
    operator: string;
    value: string;
    condition: string;
}, data: Record<string, any>): Promise<RuleEvalResult>;
//# sourceMappingURL=ruleEvaluator.d.ts.map