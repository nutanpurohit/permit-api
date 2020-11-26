import express from 'express';
import departmentReviewQuestionCtrl from '../controllers/department-review-question.controller';

const router = express.Router();

router.route('/')

    /** GET /api/{version}/departmentReviewQuestion - Return all departmentReviewQuestion */
    .get(departmentReviewQuestionCtrl.getAll)

    /** GET /api/{version}/departmentReviewQuestion - Create new departmentReviewQuestion */
    .post(departmentReviewQuestionCtrl.create);

router.route('/:id')

    /** GET /api/{version}/departmentReviewQuestion - Update departmentReviewQuestion */
    .put(departmentReviewQuestionCtrl.update)

    /** GET /api/{version}/departmentReviewQuestion - Delete departmentReviewQuestion */
    .delete(departmentReviewQuestionCtrl.deleteDapartmentReviewQuestion);


export default router;
