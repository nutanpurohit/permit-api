import express from 'express';
import formAttachmentsCtrl from '../controllers/form-attachments.controller';

const router = express.Router();

router.route('/:formType/:formId')

    /** POST /api/{version}/form-attachments/:formType/:formId - Create form attachments */
    .post(formAttachmentsCtrl.create);

export default router;
