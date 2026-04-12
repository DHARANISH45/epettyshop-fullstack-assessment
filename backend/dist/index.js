"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const workflows_1 = require("./api/workflows");
const steps_1 = require("./api/steps");
const rules_1 = require("./api/rules");
const executions_1 = require("./api/executions");
const errorHandler_1 = require("./middleware/errorHandler");
const tenant_1 = require("./middleware/tenant");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Tenant isolation middleware - all API routes require tenant_id
app.use('/api', tenant_1.tenantMiddleware);
// Routes
app.use('/api/workflows', workflows_1.workflowRouter);
app.use('/api/steps', steps_1.stepRouter);
app.use('/api/rules', rules_1.ruleRouter);
app.use('/api/executions', executions_1.executionRouter);
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error handler
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Merchant Automation Hub API running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map