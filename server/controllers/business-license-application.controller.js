import httpStatus from 'http-status';
import * as _ from 'lodash';
import async from 'async';
import db from '../../config/sequelize';

const {
    BusinessLicenseApplication,
    OrganizationType,
    ClearanceType,
    ApplicationStatusType,
} = db;

/**
 * Create new Business License Application record
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function create(req, res, next) {
    const payload = req.body;

    // eslint-disable-next-line no-use-before-define
    validateCreatePayload(payload, (validationErr) => {
        if (validationErr) {
            const e = new Error(validationErr);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        BusinessLicenseApplication.create(payload)
            .then((createdRecord) => {
                // eslint-disable-next-line no-use-before-define
                getCompleteLicenseApplicationForm(createdRecord.id, (err, response) => {
                    if (err) {
                        return next(err);
                    }

                    return res.json(response.applicationForm);
                });
            })
            .catch(() => {
                const e = new Error('An error occurred while posting the business license application form');
                e.status = httpStatus.INTERNAL_SERVER_ERROR;
                return next(e);
            });
    });
}

/**
 * get specific Business License Application record
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function get(req, res, next) {
    const applicationId = req.params.id;

    // eslint-disable-next-line no-use-before-define
    getCompleteLicenseApplicationForm(applicationId, (err, response) => {
        if (err) {
            return next(err);
        }

        return res.json(response.applicationForm);
    });
}


export default {
    get, create,
};

const validateCreatePayload = (payload, callback) => {
    async.waterfall([
        (cb) => {
            if (!_.isEmpty(payload.clearanceTypeIds)) {
                return ClearanceType.findAll({ where: { id: payload.clearanceTypeIds } })
                    .then((types) => {
                        if (_.isEmpty(types) || types.length !== payload.clearanceTypeIds.length) {
                            return cb('The clearance type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking clearance types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.organizationTypeId) {
                return OrganizationType.findOne({ where: { id: payload.organizationTypeId } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The organization type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking organization types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.applicationStatusId) {
                return ApplicationStatusType.findByPk(payload.applicationStatusId)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The application status type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking application status type');
                    });
            }
            cb();
        },
    ], (waterfallErr) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }

        return callback();
    });
};

const getCompleteLicenseApplicationForm = (applicationId, callback) => {
    async.waterfall([
        // find form details
        (cb) => {
            const processingData = {};
            BusinessLicenseApplication.findOne({
                where: { id: applicationId },
                raw: true,
            })
                .then((applicationForm) => {
                    if (_.isEmpty(applicationForm)) {
                        const e = new Error('The business license application form with the given id do not exist');
                        e.status = httpStatus.NOT_FOUND;
                        return cb(e);
                    }

                    processingData.applicationForm = applicationForm;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the business license application form details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the application status
        (processingData, cb) => {
            const { applicationStatusId } = processingData.applicationForm;
            if (!applicationStatusId) {
                return cb(null, processingData);
            }

            ApplicationStatusType.findByPk(applicationStatusId)
                .then((applicationStatusType) => {
                    if (_.isEmpty(applicationStatusType)) {
                        const e = new Error('The application status type is invalid');
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    }

                    processingData.applicationForm.applicationStatus = applicationStatusType.name;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding application status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
    ], (waterfallErr, processingData) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }

        callback(null, processingData);
    });
};
