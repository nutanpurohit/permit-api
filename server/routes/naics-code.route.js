import express from 'express';
import naicsCodeCtrl from '../controllers/naics-code.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/naics-code - Return all NAICS codes */
    .get(naicsCodeCtrl.getAll)

    /** POST /api/{version}/naics-code - create a new NAICS codes */
    .post(naicsCodeCtrl.create);

router.route('/:id')

    /** DELETE /api/{version}/naics-code/id - delete NAICS codes */
    .delete(naicsCodeCtrl.deleteNaics);

export default router;
