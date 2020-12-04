import async from 'async';
import httpStatus from 'http-status';
import { Error } from 'sequelize';
import db from '../../config/sequelize';
import departmentReviewAnswerCtrl from './department-review-answer.controller';

const {
    BusinessLicenseAgencyReview,
    BusinessLicenseApplication,
} = db;


function getSingle(req, res, next) {
    const { depId, formId } = req.params;

    async.waterfall([
        (cb) => {
            BusinessLicenseAgencyReview.findOne({
                where: { applicationFormId: formId, departmentId: depId },
            })
                .then((record) => {
                    const processingData = { record };
                    cb(null, processingData);
                })
                .catch(next);
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }
        const response = processingData.record || {};
        return res.json(response);
    });
}

function updateStatus(req, res, next) {
    const { depId, formId } = req.params;
    const payload = req.body;

    async.waterfall([
        (cb) => {
            const update = { reviewStatus: payload.applicationStatusId };
            const updateOption = { where: { applicationFormId: formId, departmentId: depId } };
            BusinessLicenseAgencyReview.update(update, updateOption)
                .then(() => {
                    return cb();
                })
                .catch(() => {
                    const e = new Error('Something went wrong while updating the status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        (cb) => {
            BusinessLicenseAgencyReview.findAll(
                { where: { applicationFormId: formId } },
            )
                .then((agencyReviewRecords) => {
                    // eslint-disable-next-line eqeqeq
                    const allAgencyReviewComplete = agencyReviewRecords.every((agencyReviewRecord) => agencyReviewRecord.reviewStatus == 13);
                    if (!allAgencyReviewComplete) {
                        return cb();
                    }
                    const update = { applicationStatusId: 13 };
                    const updateOption = { where: { id: formId } };
                    BusinessLicenseApplication.update(update, updateOption)
                        .then(() => {
                            return cb();
                        })
                        .catch(() => {
                            const e = new Error('Something went wrong while updating the status of the application');
                            e.status = httpStatus.INTERNAL_SERVER_ERROR;
                            return cb(e);
                        });
                })
                .catch(() => {
                    const e = new Error('Something went wrong while updating the status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
    ], (error) => {
        if (error) {
            return next(error);
        }

        return res.json({
            status: 'Application status updated successfully',
        });
    });
}

function getAssignedAgencies(req, res, next) {
    const { formId } = req.params;

    departmentReviewAnswerCtrl.getAllBusinessLicenseAgencies(formId, (err, agencyRecords) => {
        if (err) {
            return next(err);
        }
        return res.json(agencyRecords);
    });
}

function addAgency(req, res, next) {
    const validateErr = validatePayload(req.body);
    if (validateErr) {
        const e = new Error(validateErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }
    async.waterfall([
        (cb) => {
            BusinessLicenseAgencyReview.create(req.body).then(() => {
                return cb();
            }).catch(cb);
        },
    ], (err) => {
        if (err) {
            return next(err);
        }
        return res.json({
            status: 'Agency addedd successfully',
        });
    });
}

function deleteAgency(req, res, next) {
    const validateErr = validatePayload(req.body);
    if (validateErr) {
        const e = new Error(validateErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }
    const deleteWhereCondition = getDeleteWhereCondition(req.body);
    async.waterfall([
        (cb) => {
            BusinessLicenseAgencyReview.destroy({ where: { deleteWhereCondition } }).then(() => {
                return cb();
            }).catch(cb);
        },
    ], (err) => {
        if (err) {
            return next(err);
        }
        return res.json({
            status: 'Agency deleted successfully',
        });
    });
}

export default {
    getSingle, updateStatus, getAssignedAgencies, addAgency, deleteAgency,
};

const validatePayload = (body) => {
    const {
        applicationFormId, departmentId, departmentDivisionId,
    } = body;

    if (!applicationFormId) {
        return 'applicationFormId is missing';
    }
    if (!departmentId && !departmentDivisionId) {
        return 'departmentId and departmentDivisionId both are missing';
    }
};

const getDeleteWhereCondition = (params) => {
    const {
        applicationFormId, departmentId, departmentDivisionId,
    } = params;

    const whereCondition = {};

    if (departmentId) {
        whereCondition.departmentId = departmentId;
    }
    if (applicationFormId) {
        whereCondition.applicationFormId = applicationFormId;
    }
    if (departmentDivisionId) {
        whereCondition.applicationFormId = departmentDivisionId;
    }
    return whereCondition;
};
