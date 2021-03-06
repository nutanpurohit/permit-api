import express from 'express';
import naicsCodeCtrl from '../controllers/naics-code.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/naics-code - Return all NAICS codes */
    .get(naicsCodeCtrl.getAll)

    /** POST /api/{version}/naics-code - create a new NAICS codes */
    .post(naicsCodeCtrl.create);

router.route('/admin-codes')

    /** GET /api/{version}/naics-code/admin-codes - Return all NAICS codes for Admin purpose */
    .get(naicsCodeCtrl.getAllForAdmin);

router.route('/:id')

    /** GET /api/{version}/naics-code/:id - operations for specific NAICS */
    .get(naicsCodeCtrl.get)

    /** DELETE /api/{version}/naics-code/id - delete NAICS codes */
    .delete(naicsCodeCtrl.deleteNaics)

    /** PUT /api/{version}/naics-code/id - update NAICS */
    .put(naicsCodeCtrl.updateNAICS);

router.route('/status/:id')
    /** PUT /api/{version}/naics-code/id - update NAICS Status */
    .put(naicsCodeCtrl.updateNAICSStatus);

router.route('/options/:codeId')
    /** GET /api/{version}/naics-code/options/:code - operations for get NAICS code option list */
    .get(naicsCodeCtrl.getCodeOption);

export default router;
