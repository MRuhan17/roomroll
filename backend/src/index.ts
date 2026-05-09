import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import campaignRoutes from './routes/campaignRoutes';
import mapRoutes from './routes/mapRoutes';
import tokenRoutes from './routes/tokenRoutes';
import aiRoutes from './routes/aiRoutes';
import { initializeSocket } from './socket';
import { corsOptions } from './config/cors';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/campaigns/:campaignId/maps', mapRoutes);
app.use('/api/campaigns/:campaignId/tokens', tokenRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Roomroll Backend is running' });
});

initializeSocket(httpServer);

httpServer.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
