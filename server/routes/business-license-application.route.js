import express from 'express';
import businessLicenseApplicationCtrl from '../controllers/business-license-application.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** GET /api/{version}/business-license-application - Get all business-license-application records */
    .get(businessLicenseApplicationCtrl.getAll)

    /** POST /api/{version}/business-license-application - Create new business-license-application record */
    .post(businessLicenseApplicationCtrl.create);

router.route('/:id')

    /** GET /api/{version}/business-license-application/:id - operations for retrieving specific business-license-application */
    .get(businessLicenseApplicationCtrl.get);

export default router;
