import express from 'express';
import buildingPermitRoutes from './building-permit.route';
import buildingPermitOptions from './building-permit-options.route';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

// mount building permit routes
router.use('/building-permit', buildingPermitRoutes);

// mount building permit routes
router.use('/building-permit-options', buildingPermitOptions);

export default router;
