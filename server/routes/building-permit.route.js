import express from 'express';
import buildingPermitCtrl from '../controllers/building-permit.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** POST /api/{version}/building-permit - Create new building permit */
    .post(buildingPermitCtrl.create);

router.route('/:id')

    /** GET /api/{version}/building-permit/:id - operations for specific building permit */
    .get(buildingPermitCtrl.get);

router.route('/staff/:id')
    /** PUT /api/{version}/building-permit/staff/:id - Update building permit info by the staff users */
    .put(buildingPermitCtrl.updatePermitByStaff);

export default router;
