import express from 'express';
import departmentReviewQuestionCtrl from '../controllers/department-review-question.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/departmentType - Return all department types */
    .get(departmentReviewQuestionCtrl.getAll)

    /** POST /api/{version}/ - create a new department types */
    .post(departmentReviewQuestionCtrl.create);

export default router;
