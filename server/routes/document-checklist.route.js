import express from 'express';
import DocumentChecklistCtrl from '../controllers/document-checklist.controller';


const router = express.Router();

router.route('/:applicationTypeId')
    /** GET /api/{version}/documen-list/:appliactionTypeId - Create form attachments */
    .get(DocumentChecklistCtrl.getAll);

export default router;
