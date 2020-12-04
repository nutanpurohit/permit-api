import express from 'express';
import departmentReviewAnswerCtrl from '../controllers/department-review-answer.controller';

const router = express.Router();

router.route('/')
    /** POST /api/{version}/department-review-answer - create/update departmentReviewAnswer */
    .post(departmentReviewAnswerCtrl.create);
router.route('/:applicationFormType/:applicationFormId')
    /** GET /api/{version}/department-review-answer - get departmentReviewAnswers */
    .get(departmentReviewAnswerCtrl.getAll);

router.route('/all/:applicationFormType/:applicationFormId')
    /** GET /api/{version}/department-review-answer/all/:applicationFormType/:applicationFormId - get alldepartmentReviewAnswers */
    .get(departmentReviewAnswerCtrl.getAllDepartmentReviewAnswer);

export default router;
