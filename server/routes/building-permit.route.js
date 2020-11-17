import express from 'express';
import buildingPermitCtrl from '../controllers/building-permit.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** POST /api/{version}/building-permit - Create new building permit */
    .post(buildingPermitCtrl.create);

router.route('/:id')

    /** GET /api/{version}/building-permit/:id - operations for specific building permit */
    .get(buildingPermitCtrl.get)

    .put(buildingPermitCtrl.update);

export default router;
