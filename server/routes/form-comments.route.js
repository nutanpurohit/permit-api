import express from 'express';
import formCommentsCtrl from '../controllers/form-comment.controller';

const router = express.Router();

router.route('/:formType/:formId')

    /** GET /api/{version}/form-comments/:formType/:formId - Return all comments for specific form */
    .get(formCommentsCtrl.getAll)

    /** POST /api/{version}/form-comments/:formType/:formId - Create comments */
    .post(formCommentsCtrl.create);

export default router;
