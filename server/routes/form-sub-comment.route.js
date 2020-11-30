import express from 'express';
import formSubCommentCntrl from '../controllers/form-sub-comment.controller';

const router = express.Router();

router.route('/:formType')

/** POST /api/{version}/form-comments/:formType/:formId - Create comments */
    .post(formSubCommentCntrl.create);


export default router;
