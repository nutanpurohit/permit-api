import express from 'express';
import formCommentsCtrl from '../controllers/form-comment.controller';

const router = express.Router();

router.route('/:formType/:formId')

    /** GET /api/{version}/form-comments/:formType/:formId - Return all comments for specific form */
    .get(formCommentsCtrl.getAll)

    /** POST /api/{version}/form-comments/:formType/:formId - Create comments */
    .post(formCommentsCtrl.create);

router.route('/:formType/:formId/comment-read-status')

/** PUT /api/{version}/form-comments/:formType/:formId - Update comment readStatus of perticular form's comment */
    .put(formCommentsCtrl.updateStatus);

export default router;
