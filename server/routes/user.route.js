import express from 'express';
import userCtrl from '../controllers/user.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/users- Return the user list */
    .get(userCtrl.getAll);


export default router;
