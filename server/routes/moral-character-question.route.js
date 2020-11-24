import express from 'express';
import moralCharacterQuestionCtrl from '../controllers/moral-character-question.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/moral-character-question - Return all Moral Character Question records */
    .get(moralCharacterQuestionCtrl.getAll);

export default router;
