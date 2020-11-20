import express from 'express';
import departmentTypeCtrl from '../controllers/departmentType.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/departmentType - Return all department types */
    .get(departmentTypeCtrl.getAll);

export default router;
