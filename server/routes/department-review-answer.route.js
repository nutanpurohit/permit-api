import express from 'express';
import departmentReviewAnswerCtrl from '../controllers/department-review-answer.controller';

const router = express.Router();

router.route('/')
    /** GET /api/{version}/departmentReviewAnswer - create departmentReviewAnswer */
    .post(departmentReviewAnswerCtrl.create);

export default router;
