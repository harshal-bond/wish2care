import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.js';
import { studentsRoutes } from './routes/students.js';
import { schoolsRoutes } from './routes/schools.js';
import { exportRoutes } from './routes/export.js';
import { healthRecordsRoutes } from './routes/healthRecords.js';
const app = new Hono();
app.use('*', logger());
app.use('/api/*', cors({
    origin: '*', // For development. In production, restrict this.
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));
// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/schools', schoolsRoutes);
app.route('/api/students', studentsRoutes);
app.route('/api/health-records', healthRecordsRoutes);
app.route('/api/export', exportRoutes);
// Error handler
app.onError((err, c) => {
    console.error('Server error:', err);
    return c.json({ success: false, error: err.message || 'Internal Server Error' }, 500);
});
const port = parseInt(process.env.PORT || '3000', 10);
console.log(`Server running on port ${port}`);
serve({
    fetch: app.fetch,
    port,
});
//# sourceMappingURL=index.js.map