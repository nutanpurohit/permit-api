import express from 'express';
import departmentReviewAnswerCtrl from '../controllers/department-review-answer.controller';

const router = express.Router();

router.route('/')
    /** POST /api/{version}/departmentReviewAnswer - create/update departmentReviewAnswer */
    .post(departmentReviewAnswerCtrl.create);
router.route('/:applicationFormType/:applicationFormId')
    /** GET /api/{version}/departmentReviewAnswer - get departmentReviewAnswers */
    .get(departmentReviewAnswerCtrl.getAll);

export default router;
