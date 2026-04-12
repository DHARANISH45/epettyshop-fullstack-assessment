import jexl from 'jexl';

/**
 * Safe rule evaluation engine using JEXL (JavaScript Expression Language).
 * NO unsafe eval() - JEXL sandboxes expression evaluation.
 */

// Add custom transforms for common operations
jexl.addTransform('lower', (val: string) => (typeof val === 'string' ? val.toLowerCase() : val));
jexl.addTransform('upper', (val: string) => (typeof val === 'string' ? val.toUpperCase() : val));
jexl.addTransform('length', (val: any) => (Array.isArray(val) ? val.length : typeof val === 'string' ? val.length : 0));

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
export function buildCondition(field: string, operator: string, value: string): string {
  // Handle numeric values
  const numValue = Number(value);
  const isNumeric = !isNaN(numValue) && value.trim() !== '';

  // Handle boolean values
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return `data.${field} ${convertOperator(operator)} ${value.toLowerCase()}`;
  }

  if (isNumeric) {
    return `data.${field} ${convertOperator(operator)} ${numValue}`;
  }

  // String comparison
  return `data.${field} ${convertOperator(operator)} "${value}"`;
}

/**
 * Convert user-friendly operators to JEXL-compatible operators.
 */
function convertOperator(op: string): string {
  const operatorMap: Record<string, string> = {
    '==': '==',
    '===': '==',
    '!=': '!=',
    '!==': '!=',
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
    'equals': '==',
    'not_equals': '!=',
    'greater_than': '>',
    'greater_than_or_equal': '>=',
    'less_than': '<',
    'less_than_or_equal': '<=',
    'contains': '=~',
  };

  return operatorMap[op] || op;
}

/**
 * Evaluate a single JEXL condition against a data context.
 * Returns true/false without throwing.
 */
export async function evaluateCondition(
  condition: string,
  context: Record<string, any>
): Promise<{ passed: boolean; error?: string }> {
  try {
    // Handle DEFAULT rule
    if (condition === 'DEFAULT' || condition === 'true' || condition.trim() === '') {
      return { passed: true };
    }

    const result = await jexl.eval(condition, context);
    return { passed: Boolean(result) };
  } catch (error: any) {
    return { passed: false, error: error.message };
  }
}

/**
 * Evaluate a structured rule (field, operator, value) against payload data.
 */
export async function evaluateRule(
  rule: { id: string; field: string; operator: string; value: string; condition: string },
  data: Record<string, any>
): Promise<RuleEvalResult> {
  const context = { data };

  // Get actual value from data using field path
  const actualValue = getNestedValue(data, rule.field);
  const { passed, error } = await evaluateCondition(rule.condition, context);

  return {
    ruleId: rule.id,
    field: rule.field,
    operator: rule.operator,
    expectedValue: rule.value,
    actualValue,
    condition: rule.condition,
    passed,
    error,
  };
}

/**
 * Get a nested value from an object using dot notation.
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}
