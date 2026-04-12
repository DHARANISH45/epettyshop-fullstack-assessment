"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCondition = buildCondition;
exports.evaluateCondition = evaluateCondition;
exports.evaluateRule = evaluateRule;
const jexl_1 = __importDefault(require("jexl"));
/**
 * Safe rule evaluation engine using JEXL (JavaScript Expression Language).
 * NO unsafe eval() - JEXL sandboxes expression evaluation.
 */
// Add custom transforms for common operations
jexl_1.default.addTransform('lower', (val) => (typeof val === 'string' ? val.toLowerCase() : val));
jexl_1.default.addTransform('upper', (val) => (typeof val === 'string' ? val.toUpperCase() : val));
jexl_1.default.addTransform('length', (val) => (Array.isArray(val) ? val.length : typeof val === 'string' ? val.length : 0));
/**
 * Build a JEXL expression from structured rule components.
 */
function buildCondition(field, operator, value) {
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
function convertOperator(op) {
    const operatorMap = {
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
async function evaluateCondition(condition, context) {
    try {
        // Handle DEFAULT rule
        if (condition === 'DEFAULT' || condition === 'true' || condition.trim() === '') {
            return { passed: true };
        }
        const result = await jexl_1.default.eval(condition, context);
        return { passed: Boolean(result) };
    }
    catch (error) {
        return { passed: false, error: error.message };
    }
}
/**
 * Evaluate a structured rule (field, operator, value) against payload data.
 */
async function evaluateRule(rule, data) {
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
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}
//# sourceMappingURL=ruleEvaluator.js.map