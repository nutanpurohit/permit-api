import express from 'express';
import naicsDepartmentRelationshipCtrl from '../controllers/naics-deparment-relationship.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/naics-deparment - Return all NAICS-department relationship records */
    .get(naicsDepartmentRelationshipCtrl.getAll)

    /** POST /api/{version}/naics-deparment - Create a new NAICS-department relationship records */
    .post(naicsDepartmentRelationshipCtrl.create);

router.route('/:id')

    /** PUT /api/{version}/naics-deparment/id - update naics - department relationship */
    .put(naicsDepartmentRelationshipCtrl.updateRelationship)

    /** DELETE /api/{version}/naics-deparment/id - delete naics - department relationship */
    .delete(naicsDepartmentRelationshipCtrl.deleteRelationship);

export default router;
