import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { adminServicesRouter } from './services.admin.js';
import { adminAvailabilityRouter } from './availability.admin.js';
import { adminBlackoutsRouter } from './blackouts.admin.js';
import { adminBookingsRouter } from './bookings.admin.js';
import { adminStatsRouter } from './stats.admin.js';

// All admin routes require a valid session.
export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use('/services', adminServicesRouter);
adminRouter.use('/availability', adminAvailabilityRouter);
adminRouter.use('/blackouts', adminBlackoutsRouter);
adminRouter.use('/bookings', adminBookingsRouter);
adminRouter.use('/stats', adminStatsRouter);
