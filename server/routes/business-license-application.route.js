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
    .get(businessLicenseApplicationCtrl.get)

    /** PUT /api/{version}/business-license-application/:id - operations for updating specific business-license-application */
    .put(businessLicenseApplicationCtrl.updateApplicationForm);

router.route('/global-search')

    /** POST /api/{version}/business-license-application/global-search - Global search on the business license columns */
    .post(businessLicenseApplicationCtrl.globalSearch);

router.route('/:id/change-status')

    /** POST /api/{version}/business-license-application/:id/change-status - operations for changing the business-license-application status */
    .put(businessLicenseApplicationCtrl.changeApplicationStatus);

export default router;
