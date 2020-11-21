import express from 'express';
import departmentTypeCtrl from '../controllers/departmentType.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/departmentType - Return all department types */
    .get(departmentTypeCtrl.getAll)

    /** POST /api/{version}/departmentType - create a new department types */
    .post(departmentTypeCtrl.create);

router.route('/:id')

    /** DELETE /api/{version}/departmentType/id - delete department types */
    .delete(departmentTypeCtrl.deleteDepartment);

export default router;
