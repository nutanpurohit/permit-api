import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

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
    const queryValidationErr = validateGetAllQuery(req.query);
    if (queryValidationErr) {
        const e = new Error(queryValidationErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }
    const { formId } = req.params;
    const {
        limit = 200,
        start = 0,
        sortColumn = 'id',
        sortBy = 'ASC',
    } = req.query;
    const offset = start;
    const whereCondtion = {
        applicationFormId: formId,
    };
    async.waterfall([
        (cb) => {
            BusinessLicenseAgencyReview.findAll({
                where: whereCondtion,
                offset,
                limit,
                order: [
                    [sortColumn, sortBy.toUpperCase()],
                ],
            }).then((response) => {
                return cb(null, response);
            }).catch((err) => {
                return cb(err);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }
        return res.json(processingData);
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

function addAgency(req, res, next){

}

function deleteAgency(req, res, next){

}

export default {
    getSingle, updateStatus, getAssignedAgencies, updateAssignedAgencies,
};

const validateGetAllQuery = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
    const allowedSortingColumn = [
        'id',
        'createdAt',
        'updatedAt',
    ];
    const allowedSortBy = ['asc', 'desc'];

    if (!_.isUndefined(limit) && isNaN(limit)) {
        return 'limit value should be integer';
    }

    if (!_.isUndefined(limit) && limit < 1) {
        return 'limit value cannot be less than 1';
    }

    if (!_.isUndefined(start) && isNaN(start)) {
        return 'start value should be integer';
    }

    if (!_.isUndefined(start) && start < 0) {
        return 'start value cannot be less than 0';
    }

    if (!_.isUndefined(sortColumn) && !allowedSortingColumn.includes(sortColumn)) {
        return 'The given sorting column is not supported';
    }

    if (!_.isUndefined(sortBy) && !allowedSortBy.includes(sortBy)) {
        return 'The given sortBy value is not supported';
    }

    return null;
};
