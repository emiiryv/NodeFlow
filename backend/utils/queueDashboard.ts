// backend/utils/queueDashboard.ts

import { verifyToken } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { thumbnailQueue, metadataQueue } from '../jobs/queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(thumbnailQueue),
    new BullMQAdapter(metadataQueue),
  ],
  serverAdapter,
});

export default serverAdapter;

export const secureQueueDashboard = [verifyToken, isAdmin, serverAdapter.getRouter()];