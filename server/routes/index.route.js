import express from 'express';
import buildingPermitRoutes from './building-permit.route';
import buildingPermitOptions from './building-permit-options.route';
import buildingLicenseApplicationOptions from './business-license-application-option.route';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

// mount building permit routes
router.use('/building-permit', buildingPermitRoutes);

// mount building permit option routes
router.use('/building-permit-options', buildingPermitOptions);

// mount building license application option routes
router.use('/business-license-application-options', buildingLicenseApplicationOptions);

export default router;
