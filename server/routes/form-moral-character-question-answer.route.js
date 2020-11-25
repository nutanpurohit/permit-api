import express from 'express';
import moralCharacterAnswersCtrl from '../controllers/form-moral-character-question-answer.controller';

const router = express.Router();

router.route('/:formType/:formId')

    /** POST /api/{version}/moral-character-answers/:formType/:formId - Create the moral character answers */
    .post(moralCharacterAnswersCtrl.create)

    /** GET /api/{version}/moral-character-answers/:formType/:formId - get the moral character answers */
    .get(moralCharacterAnswersCtrl.getAllAnswers)

    /** PUT /api/{version}/moral-character-answers/:formType/:formId - Update the moral character answers */
    .put(moralCharacterAnswersCtrl.updateFormMoralCharacterQA);

export default router;
