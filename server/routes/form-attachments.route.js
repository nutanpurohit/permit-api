import express from 'express';
import formAttachmentsCtrl from '../controllers/form-attachments.controller';

const router = express.Router();

router.route('/:formType/:formId')

    /** POST /api/{version}/form-attachments/:formType/:formId - Create form attachments */
    .post(formAttachmentsCtrl.create);

router.route('/attachment/:attachmentId/:formType/:formId')

    /** DELETE /api/{version}/form-attachments/attachment/:id/:formType/:formId - delete specific form attachment */
    .delete(formAttachmentsCtrl.deleteAttachment);

export default router;
