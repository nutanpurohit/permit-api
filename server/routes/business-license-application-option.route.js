import express from 'express';
import buildingLicenseApplicationOptionCtrl from '../controllers/business-license-application-option.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** GET /api/{version}/business-license-application-options - Return necessary options for business-license-application form */
    .get(buildingLicenseApplicationOptionCtrl.getAll);

export default router;
