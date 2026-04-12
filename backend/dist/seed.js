"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./models/prisma"));
const DEMO_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
async function seed() {
    console.log('🌱 Seeding database...');
    // Clean up existing data for demo tenant
    await prisma_1.default.execution.deleteMany({ where: { tenant_id: DEMO_TENANT_ID } });
    await prisma_1.default.workflow.deleteMany({ where: { tenant_id: DEMO_TENANT_ID } });
    // Create a sample workflow: Order Processing Pipeline
    const workflow = await prisma_1.default.workflow.create({
        data: {
            tenant_id: DEMO_TENANT_ID,
            name: 'Order Processing Pipeline',
            trigger_event: 'order.created',
            is_active: true,
        },
    });
    console.log(`✅ Created workflow: ${workflow.name}`);
    // Step 1: Fraud Check
    const step1 = await prisma_1.default.step.create({
        data: {
            workflow_id: workflow.id,
            name: 'Fraud Check',
            step_type: 'action',
            step_order: 0,
            metadata: { description: 'Check fraud score from risk assessment' },
        },
    });
    // Step 2: VIP Processing 
    const step2 = await prisma_1.default.step.create({
        data: {
            workflow_id: workflow.id,
            name: 'VIP Customer Processing',
            step_type: 'action',
            step_order: 1,
            metadata: { description: 'Apply VIP benefits and priority shipping' },
        },
    });
    // Step 3: High Value Order Approval
    const step3 = await prisma_1.default.step.create({
        data: {
            workflow_id: workflow.id,
            name: 'High Value Order Approval',
            step_type: 'approval',
            step_order: 2,
            metadata: { description: 'Manager approval for high value orders' },
        },
    });
    // Step 4: Send Confirmation
    const step4 = await prisma_1.default.step.create({
        data: {
            workflow_id: workflow.id,
            name: 'Send Confirmation Email',
            step_type: 'notification',
            step_order: 3,
            metadata: { description: 'Send order confirmation to customer' },
        },
    });
    // Step 5: Flag for Review (fraud)
    const step5 = await prisma_1.default.step.create({
        data: {
            workflow_id: workflow.id,
            name: 'Flag for Manual Review',
            step_type: 'approval',
            step_order: 4,
            metadata: { description: 'Flag high-risk orders for manual review' },
        },
    });
    console.log('✅ Created 5 steps');
    // Rules for Step 1 (Fraud Check)
    await prisma_1.default.rule.createMany({
        data: [
            {
                step_id: step1.id,
                field: 'risk_assessment.fraud_score',
                operator: '>',
                value: '70',
                condition: 'data.risk_assessment.fraud_score > 70',
                next_step_id: step5.id, // Flag for review
                priority: 0,
            },
            {
                step_id: step1.id,
                field: 'risk_assessment.risk_level',
                operator: '==',
                value: 'High',
                condition: 'data.risk_assessment.risk_level == "High"',
                next_step_id: step5.id, // Flag for review
                priority: 1,
            },
            {
                step_id: step1.id,
                field: 'DEFAULT',
                operator: '==',
                value: 'true',
                condition: 'DEFAULT',
                next_step_id: step2.id, // Continue to VIP check
                priority: 2,
            },
        ],
    });
    // Rules for Step 2 (VIP Processing)
    await prisma_1.default.rule.createMany({
        data: [
            {
                step_id: step2.id,
                field: 'customer.loyalty_tier',
                operator: '==',
                value: 'Gold',
                condition: 'data.customer.loyalty_tier == "Gold"',
                next_step_id: step3.id, // High value check
                priority: 0,
            },
            {
                step_id: step2.id,
                field: 'customer.loyalty_tier',
                operator: '==',
                value: 'Platinum',
                condition: 'data.customer.loyalty_tier == "Platinum"',
                next_step_id: step3.id, // High value check
                priority: 1,
            },
            {
                step_id: step2.id,
                field: 'DEFAULT',
                operator: '==',
                value: 'true',
                condition: 'DEFAULT',
                next_step_id: step3.id, // Continue to high value check
                priority: 2,
            },
        ],
    });
    // Rules for Step 3 (High Value Order)
    await prisma_1.default.rule.createMany({
        data: [
            {
                step_id: step3.id,
                field: 'order_details.total_amount',
                operator: '>',
                value: '500',
                condition: 'data.order_details.total_amount > 500',
                next_step_id: step4.id, // Needs approval, then confirm
                priority: 0,
            },
            {
                step_id: step3.id,
                field: 'DEFAULT',
                operator: '==',
                value: 'true',
                condition: 'DEFAULT',
                next_step_id: step4.id, // Skip approval, go to confirm
                priority: 1,
            },
        ],
    });
    // Rules for Step 4 (Send Confirmation) - terminal step
    await prisma_1.default.rule.createMany({
        data: [
            {
                step_id: step4.id,
                field: 'customer.email',
                operator: '!=',
                value: '',
                condition: 'data.customer.email != ""',
                next_step_id: null, // End workflow
                priority: 0,
            },
        ],
    });
    console.log('✅ Created rules for all steps');
    // Create a second workflow
    const workflow2 = await prisma_1.default.workflow.create({
        data: {
            tenant_id: DEMO_TENANT_ID,
            name: 'Inventory Alert System',
            trigger_event: 'inventory.low',
            is_active: true,
        },
    });
    const alertStep1 = await prisma_1.default.step.create({
        data: {
            workflow_id: workflow2.id,
            name: 'Check Stock Level',
            step_type: 'action',
            step_order: 0,
            metadata: { description: 'Evaluate current stock levels' },
        },
    });
    const alertStep2 = await prisma_1.default.step.create({
        data: {
            workflow_id: workflow2.id,
            name: 'Notify Warehouse',
            step_type: 'notification',
            step_order: 1,
            metadata: { description: 'Send alert to warehouse team' },
        },
    });
    await prisma_1.default.rule.create({
        data: {
            step_id: alertStep1.id,
            field: 'stock_count',
            operator: '<',
            value: '10',
            condition: 'data.stock_count < 10',
            next_step_id: alertStep2.id,
            priority: 0,
        },
    });
    console.log(`✅ Created workflow: ${workflow2.name}`);
    // Create an inactive workflow
    await prisma_1.default.workflow.create({
        data: {
            tenant_id: DEMO_TENANT_ID,
            name: 'Customer Feedback Loop',
            trigger_event: 'feedback.submitted',
            is_active: false,
        },
    });
    console.log('✅ Created inactive workflow: Customer Feedback Loop');
    console.log('\n🎉 Seed complete!');
    console.log(`\n📋 Demo Tenant ID: ${DEMO_TENANT_ID}`);
    console.log('Use this in X-Tenant-ID header for API calls.');
}
seed()
    .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
//# sourceMappingURL=seed.js.map