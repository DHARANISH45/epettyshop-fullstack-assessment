import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { workflowRouter } from './api/workflows';
import { stepRouter } from './api/steps';
import { ruleRouter } from './api/rules';
import { executionRouter } from './api/executions';
import { errorHandler } from './middleware/errorHandler';
import { tenantMiddleware } from './middleware/tenant';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Tenant isolation middleware - all API routes require tenant_id
app.use('/api', tenantMiddleware);

// Routes
app.use('/api/workflows', workflowRouter);
app.use('/api/steps', stepRouter);
app.use('/api/rules', ruleRouter);
app.use('/api/executions', executionRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Merchant Automation Hub API running on port ${PORT}`);
});

export default app;
