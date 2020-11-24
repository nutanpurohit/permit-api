import express from 'express';
import formCommentAttachmentsCtrl from '../controllers/form-comments-attachments.controller';

const router = express.Router();

router.route('/:formType/:commentId')

    /** POST /api/{version}/form-comments-attachments/:formType/:commentId - Create comment attachments */
    .post(formCommentAttachmentsCtrl.create);

router.route('/:attachmentId/:commentId')

    /** DELETE /api/{version}/form-comments-attachments/:id/:commentId - delete specific comment attachment */
    .delete(formCommentAttachmentsCtrl.deleteAttachment);

export default router;
