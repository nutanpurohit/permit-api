import express from 'express';
import buildingPermitRoutes from './building-permit.route';
import buildingPermitOptions from './building-permit-options.route';
import buildingLicenseApplicationOptions from './business-license-application-option.route';
import buildingLicenseApplication from './business-license-application.route';
import formComments from './form-comments.route';
import formAttachments from './form-attachments.route';
import naicsCodesRoute from './naics-code.route';
import departmentTypeRoute from './departmentType.route';
import naicsDepartmentRelationshipRoute from './naics-deparment-relationship.route';

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

// mount NAICS code routes
router.use('/naics-code', naicsCodesRoute);

// mount department type routes
router.use('/departmentType', departmentTypeRoute);

// mount NAICS and department routes
router.use('/naics-deparment', naicsDepartmentRelationshipRoute);

export default router;
