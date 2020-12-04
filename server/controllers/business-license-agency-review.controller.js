import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
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

function updateAssignedAgencies(req, res, next) {
    const { formId } = req.params;
    const { assignedAgenciesBody } = req.body;
    const assignedAgencyWhereCondition = {
        applicationFormId: formId,
    };
    async.waterfall([
        (cb) => {
            BusinessLicenseAgencyReview.findAll({
                where: assignedAgencyWhereCondition,
            })
                .then((records) => {
                    return cb(null, records);
                })
                .catch((err) => {
                    return cb(err);
                });
        },
        (assignedAgenciesRecords, cb) => {
            async.eachLimit(assignedAgenciesBody, 5, (agencyObj, eachCb) => {
                const newArray = assignedAgenciesRecords.find((data) => {
                    if (agencyObj.type === 'department') {
                        return parseInt(agencyObj.id) === parseInt(data.departmentId);
                    }
                    if (agencyObj.type === 'departmentDivision') {
                        return parseInt(agencyObj.id) === parseInt(data.departmentDivisionId);
                    }
                    return false;
                });
                if (!newArray) {
                    console.log('create');
                }
                eachCb(assignedAgenciesRecords);
            }, (eachErr) => {
                if (eachErr) {
                    return cb(eachErr);
                }
                return cb(null, assignedAgenciesRecords);
            });
        },
    ], (err, processData) => {
        if (err) {
            return next(err);
        }
        return res.json(processData);
    });
}

export default {
    getSingle, updateStatus, getAssignedAgencies, updateAssignedAgencies,
};
