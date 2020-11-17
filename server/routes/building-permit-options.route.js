import express from 'express';
import buildingPermitOptionCtrl from '../controllers/building-permit-option.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** GET /api/{version}/building-permit-options - Return necessary options */
    .get(buildingPermitOptionCtrl.getAll);

export default router;
