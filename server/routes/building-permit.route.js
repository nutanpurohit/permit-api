import express from 'express';
import buildingPermitCtrl from '../controllers/building-permit.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** POST /api/{version}/building-permit - Get list of building permit */
    .get(buildingPermitCtrl.getAll)

    /** POST /api/{version}/building-permit - Create new building permit */
    .post(buildingPermitCtrl.create);

router.route('/:id')

    /** GET /api/{version}/building-permit/:id - operations for specific building permit */
    .get(buildingPermitCtrl.get)

    /** PUT /api/{version}/building-permit/:id - operations for updating specific building permit */
    .put(buildingPermitCtrl.updatePermit);

router.route('/staff/:id')
    /** PUT /api/{version}/building-permit/staff/:id - Update building permit info by the staff users */
    .put(buildingPermitCtrl.updatePermitByStaff);

router.route('/global-search')

    /** POST /api/{version}/building-permit/global-search - Global search on the building permit columns */
    .post(buildingPermitCtrl.globalSearch);

export default router;
