import express from 'express';
import naicsCodeCtrl from '../controllers/naics-code.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/naics-code - Return all NAICS codes */
    .get(naicsCodeCtrl.getAll);

export default router;
