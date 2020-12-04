import express from 'express';
import BLAgencyReviewRouteCtrl from '../controllers/business-license-agency-review.controller';

const router = express.Router();

router.route('/department/:depId/applicationForm/:formId')

    /** GET /api/{version}/business-license-agency-review - Get the business license agency review status */
    .get(BLAgencyReviewRouteCtrl.getSingle);

router.route('/department/:depId/applicationForm/:formId')

    /** PUT /api/{version}/business-license-agency-review/:id/change-status - update business license agency review status */
    .put(BLAgencyReviewRouteCtrl.updateStatus);

router.route('/:formId/assigned-agencies')
    /** GET /api/{version}/business-license-agency-review/:formId/assigned-agencies - Get the business license assigned agencies */
    .get(BLAgencyReviewRouteCtrl.getAssignedAgencies)

    /** PUT /api/{version}/business-license-agency-review/:formId/assigned-agencies - Update the business license assigned agencies */
    .put(BLAgencyReviewRouteCtrl.updateAssignedAgencies);

export default router;
