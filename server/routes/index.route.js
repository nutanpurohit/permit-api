import express from 'express';
import buildingPermitRoutes from './building-permit.route';
import buildingPermitOptions from './building-permit-options.route';
import buildingLicenseApplicationOptions from './business-license-application-option.route';
import buildingLicenseApplication from './business-license-application.route';
import formComments from './form-comments.route';
import formAttachments from './form-attachments.route';
import formCommentAttachments from './form-comment-attachments.route';
import naicsCodesRoute from './naics-code.route';
import departmentTypeRoute from './departmentType.route';
import naicsDepartmentRelationshipRoute from './naics-deparment-relationship.route';
import moralCharacterQuestionRoute from './moral-character-question.route';
import moralCharacterAnswerRoute from './form-moral-character-question-answer.route';
import userRoute from './user.route';
import departReviewQuestionRoute from './department-review-question.route';
import departmentReviewAnswer from './department-review-answer.route';
import BLAgencyReviewRoute from './business-license-agency-review.route';
import DocumentListRoute from './document-checklist.route';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

// mount building permit routes
router.use('/building-permit', buildingPermitRoutes);

// mount building permit option routes
router.use('/building-permit-options', buildingPermitOptions);

// mount building license application routes
router.use('/business-license-application', buildingLicenseApplication);

// mount building license application option routes
router.use('/business-license-application-options', buildingLicenseApplicationOptions);

// mount form comments routes
router.use('/form-comments', formComments);

// mount form attachments routes
router.use('/form-attachments', formAttachments);

// mount form comments attachments routes
router.use('/form-comments-attachments', formCommentAttachments);

// mount NAICS code routes
router.use('/naics-code', naicsCodesRoute);

// mount department type routes
router.use('/departmentType', departmentTypeRoute);

// mount NAICS and department relationship routes
router.use('/naics-deparment', naicsDepartmentRelationshipRoute);

// mount moral question route
router.use('/moral-character-question', moralCharacterQuestionRoute);

// mount form moral-character-question-answers routes
router.use('/moral-character-answers', moralCharacterAnswerRoute);

// mount user routes
router.use('/users', userRoute);

// mount departmentReviewQuestion routes
router.use('/department-review-question', departReviewQuestionRoute);

// mount departmentReviewAnswer routes
router.use('/department-review-answer', departmentReviewAnswer);

// mount business-license-agency-review routes
router.use('/business-license-agency-review', BLAgencyReviewRoute);

// mount document-list routes
router.use('/document-checklist', DocumentListRoute);

export default router;
