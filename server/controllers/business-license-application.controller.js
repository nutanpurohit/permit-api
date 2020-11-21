import httpStatus from 'http-status';
import * as _ from 'lodash';
import async from 'async';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';

const { Op } = Sequelize;
const {
    BusinessLicenseApplication,
    OrganizationType,
    ClearanceType,
    ApplicationStatusType,
    FormAttachment,
    FormComment,
    NAICSType,
    FormNAICSRelationship,
    NAICSDepartmentRelationship,
    DepartmentType,
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

    validateCreatePayload(payload, (validationErr) => {
        if (validationErr) {
            const e = new Error(validationErr);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        async.waterfall([
            (cb) => {
                BusinessLicenseApplication.create(payload)
                    .then((createdRecord) => {
                        getCompleteLicenseApplicationForm(createdRecord.id, (err, response) => {
                            if (err) {
                                return cb(err);
                            }

                            const processingData = {
                                applicationForm: response.applicationForm,
                            };
                            return cb(null, processingData);
                        });
                    })
                    .catch(() => {
                        const e = new Error('An error occurred while posting the business license application form');
                        e.status = httpStatus.INTERNAL_SERVER_ERROR;
                        return cb(e);
                    });
            },
            (processingData, cb) => {
                const { naicsIds } = payload;
                if (_.isEmpty(naicsIds)) {
                    return cb(null, processingData);
                }

                const bulkCreatePayload = naicsIds.map((naicsId) => {
                    return {
                        naicsId,
                        applicationFormId: processingData.applicationForm.id,
                        applicationFormType: 'businessLicense',
                    };
                });

                FormNAICSRelationship.bulkCreate(bulkCreatePayload)
                    .then((createdRecords) => {
                        processingData.createdFormNiacsIds = createdRecords.map((createdRecord) => createdRecord.id);
                        cb(null, processingData);
                    })
                    .catch(cb);
            },
            (processingData, cb) => {
                if (_.isEmpty(processingData.createdFormNiacsIds)) {
                    return cb(null, processingData);
                }

                getFormNAICSDepartment(processingData.createdFormNiacsIds, (getErr, getResponse) => {
                    if (getErr) {
                        return cb(getErr);
                    }

                    processingData.applicationForm.attachedNAICS = getResponse;
                    cb(null, processingData);
                });
            },
        ], (err, processingData) => {
            if (err) {
                return next(err);
            }

            return res.json(processingData.applicationForm);
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

function getAll(req, res, next) {
    const queryValidationErr = validateGetAllQuery(req.query);
    if (queryValidationErr) {
        const e = new Error(queryValidationErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    const {
        limit = 10,
        start = 0,
        sortColumn = 'id',
        sortBy = 'DESC',
    } = req.query;
    const offset = start;

    const projection = businessLicenseProjection();

    async.waterfall([
        (cb) => {
            async.parallel({
                businessLicenseApplications: (done) => {
                    BusinessLicenseApplication.findAll({
                        attributes: projection,
                        offset,
                        limit,
                        order: [
                            [sortColumn, sortBy.toUpperCase()],
                        ],
                    })
                        .then((records) => {
                            return done(null, records);
                        })
                        .catch(done);
                },
                total: (done) => {
                    BusinessLicenseApplication.count()
                        .then((count) => {
                            return done(null, count);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                const processingData = {
                    businessLicenseApplications: parallelRes.businessLicenseApplications,
                    total: parallelRes.total,
                };

                return cb(null, processingData);
            });
        },
        (processingData, cb) => {
            processingData.completeApplications = [];

            async.eachSeries(processingData.businessLicenseApplications, (applicationObj, eachCb) => {
                getCompleteLicenseApplicationForm(applicationObj.id, (err, response) => {
                    if (err) {
                        return eachCb(err);
                    }

                    processingData.completeApplications.push(response.applicationForm);
                    return eachCb();
                });
            }, (eachErr) => {
                if (eachErr) {
                    return cb(eachErr);
                }
                return cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }

        const response = {
            businessLicenseApplications: processingData.completeApplications,
            total: processingData.total,
        };
        return res.json(response);
    });
}

function updateApplicationForm(req, res, next) {
    const payload = req.body;
    const applicationFormId = req.params.id;

    validateUpdatePayload(applicationFormId, payload, (validationErr) => {
        if (validationErr) {
            const e = new Error(validationErr);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        const updates = { ...payload };

        const updateOption = {
            where: {
                id: applicationFormId,
            },
        };

        BusinessLicenseApplication.update(updates, updateOption)
            .then(() => {
                getCompleteLicenseApplicationForm(applicationFormId, (err, response) => {
                    if (err) {
                        return next(err);
                    }

                    return res.json(response.applicationForm);
                });
            })
            .catch(() => {
                const e = new Error('An error occurred while updating the business license application form');
                e.status = httpStatus.INTERNAL_SERVER_ERROR;
                return next(e);
            });
    });
}

function globalSearch(req, res, next) {
    const { searchText } = req.body;

    if (_.isEmpty(searchText)) {
        const e = new Error('The search text cannot be empty');
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }
    const queryValidationErr = validateGetAllQuery(req.query);

    if (queryValidationErr) {
        const e = new Error(queryValidationErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    const {
        limit = 10,
        start = 0,
        sortColumn = 'id',
        sortBy = 'DESC',
    } = req.query;
    const offset = start;

    const projection = businessLicenseProjection();

    const whereCondition = getGlobalSearchWhereCondition(searchText);
    async.waterfall([
        (cb) => {
            async.parallel({
                businessLicenseApplications: (done) => {
                    BusinessLicenseApplication.findAll({
                        where: whereCondition,
                        attributes: projection,
                        offset,
                        limit,
                        order: [
                            [sortColumn, sortBy.toUpperCase()],
                        ],
                    })
                        .then((applications) => {
                            return done(null, applications);
                        })
                        .catch(done);
                },
                total: (done) => {
                    BusinessLicenseApplication.count({
                        where: whereCondition,
                    })
                        .then((count) => {
                            return done(null, count);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                const processingData = {
                    businessLicenseApplications: parallelRes.businessLicenseApplications,
                    total: parallelRes.total,
                };

                return cb(null, processingData);
            });
        },
        (processingData, cb) => {
            processingData.completeApplicationForm = [];

            async.eachSeries(processingData.businessLicenseApplications, (businessLicenseApplication, eachCb) => {
                getCompleteLicenseApplicationForm(businessLicenseApplication.id, (err, response) => {
                    if (err) {
                        return eachCb(err);
                    }

                    processingData.completeApplicationForm.push(response.applicationForm);
                    return eachCb();
                });
            }, (eachErr) => {
                if (eachErr) {
                    return cb(eachErr);
                }
                return cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }

        const response = {
            businessLicenseApplications: processingData.completeApplicationForm,
            total: processingData.total,
        };
        return res.json(response);
    });
}

export default {
    get, create, getAll, updateApplicationForm, globalSearch,
};

const validateCreatePayload = (payload, callback) => {
    async.waterfall([
        (cb) => {
            if (!_.isEmpty(payload.clearanceTypeIds)) {
                return ClearanceType.findAll({ where: { id: payload.clearanceTypeIds } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
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
        (cb) => {
            if (!_.isEmpty(payload.naicsIds)) {
                return NAICSType.findAll({ where: { id: payload.naicsIds } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The NAICS type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking NAICS types');
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

const validateUpdatePayload = (formId, payload, callback) => {
    async.waterfall([
        (cb) => {
            if (_.isEmpty(payload.clearanceTypeIds)) {
                return cb();
            }

            ClearanceType.findAll({ where: { id: payload.clearanceTypeIds } })
                .then((types) => {
                    if (_.isEmpty(types)) {
                        return cb('The clearance type value is incorrect');
                    }
                    cb();
                })
                .catch(() => {
                    return cb('something went wrong while checking clearance types');
                });
        },
        (cb) => {
            if (!payload.organizationTypeId) {
                return cb();
            }

            OrganizationType.findOne({ where: { id: payload.organizationTypeId } })
                .then((types) => {
                    if (_.isEmpty(types)) {
                        return cb('The organization type value is incorrect');
                    }
                    cb();
                })
                .catch(() => {
                    return cb('something went wrong while checking organization types');
                });
        },
        (cb) => {
            if (!payload.applicationStatusId) {
                return cb();
            }

            ApplicationStatusType.findByPk(payload.applicationStatusId)
                .then((types) => {
                    if (_.isEmpty(types)) {
                        return cb('The application status type value is incorrect');
                    }
                    cb();
                })
                .catch(() => {
                    return cb('something went wrong while checking application status type');
                });
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
                    processingData.applicationForm.formType = 'Business License';
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
        // find the application attachments
        (processingData, cb) => {
            const { attachments } = processingData.applicationForm;
            if (_.isEmpty(attachments)) {
                return cb(null, processingData);
            }
            FormAttachment.findAll({
                where: { id: attachments, applicationFormType: 'businessLicense' },
            })
                .then((attachmentRecords) => {
                    processingData.applicationForm.attachments = attachmentRecords;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding application attachments');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the application comments
        (processingData, cb) => {
            const { id } = processingData.applicationForm;

            FormComment.findAll({
                where: { formId: id, applicationFormType: 'businessLicense' },
            })
                .then((formComments) => {
                    processingData.applicationForm.commentsSummary = {
                        allComments: 0,
                        unread: 0,
                    };
                    if (!_.isEmpty(formComments)) {
                        processingData.applicationForm.commentsSummary = {
                            allComments: formComments.length,
                            unread: formComments.filter((comment) => !comment.isPublish).length,
                        };
                    }

                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding form comments');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the application attached NAICS
        (processingData, cb) => {
            const { id } = processingData.applicationForm;

            FormNAICSRelationship.findAll({
                where: { applicationFormId: id, applicationFormType: 'businessLicense' },
            })
                .then((formNAICSRelationships) => {
                    processingData.applicationForm.attachedNAICS = [];

                    const formNiacsIds = formNAICSRelationships.map((formNAICSRelationshipObj) => formNAICSRelationshipObj.id);
                    if (!_.isEmpty(formNiacsIds)) {
                        return getFormNAICSDepartment(formNiacsIds, (getErr, getResponse) => {
                            if (getErr) {
                                return cb(getErr);
                            }

                            processingData.applicationForm.attachedNAICS = getResponse;
                            cb(null, processingData);
                        });
                    }

                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding form comments');
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

const validateGetAllQuery = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
    const allowedSortingColumn = [
        'id',
        'ssn',
        'ein',
        'email',
        'GRTAccountNo',
        'applicantFullName',
        'registrationNo',
        'businessLocation',
        'businessAs',
        'organizationTypeId',
        'isApplicantRealPartyInterest',
        'partyName',
        'submitDate',
        'applicationStatusId',
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

const businessLicenseProjection = () => {
    const projection = [
        'id',
        'clearanceTypeIds',
        'ssn',
        'ein',
        'cellPhoneNo',
        'officeNo',
        'email',
        'GRTAccountNo',
        'BLBComments',
        'applicantFullName',
        'registrationNo',
        'mailingAddress',
        'businessLocation',
        'businessActivityDescription',
        'businessAs',
        'organizationTypeId',
        'isApplicantRealPartyInterest',
        'partyName',
        'partyAddress',
        'applicantSignature',
        'applicantTitle',
        'submitDate',
        'branchIsApplicantRealPartyInterest',
        'branchRemarks',
        'branchApproveDate',
        'issuedLicenseNo',
        'applicationStatusId',
        'createdAt',
        'updatedAt',
    ];

    return projection;
};

const getGlobalSearchWhereCondition = (searchText) => {
    const whereCondition = {
        [Op.or]: [
            {
                GRTAccountNo: {
                    [Op.like]: `%${searchText}%`,
                },
            },
            {
                id: isNaN(searchText) ? null : searchText,
            },
            {
                applicantFullName: {
                    [Op.like]: `%${searchText}%`,
                },
            },
            {
                issuedLicenseNo: {
                    [Op.like]: `%${searchText}%`,
                },
            },
        ],
    };

    return whereCondition;
};

const getFormNAICSDepartment = (formNaicsIds, callback) => {
    FormNAICSRelationship.findAll({
        where: { id: formNaicsIds },
        include: [
            {
                model: NAICSType,
                required: true,
                include: [
                    {
                        model: NAICSDepartmentRelationship,
                        include: [{ model: DepartmentType, required: true }],
                    },
                ],
            },
        ],
    })
        .then((formNAICSRecords) => {
            if (_.isEmpty(formNAICSRecords)) {
                return callback(null, []);
            }

            const finalResponse = formNAICSRecords.map((formNAICSRecord) => {
                return {
                    id: formNAICSRecord.id,
                    naicsId: formNAICSRecord.naicsId,
                    applicationFormId: formNAICSRecord.applicationFormId,
                    sequenceNo: formNAICSRecord.NAICSType.sequenceNo,
                    shortCode: formNAICSRecord.NAICSType.shortCode,
                    NAICSGroup: formNAICSRecord.NAICSType.NAICSGroup,
                    code: formNAICSRecord.NAICSType.code,
                    title: formNAICSRecord.NAICSType.title,
                    year: formNAICSRecord.NAICSType.year,
                    status: formNAICSRecord.NAICSType.status,
                    departments: _.isEmpty(formNAICSRecord.NAICSType.NAICSDepartmentRelationships) ? []
                        : formNAICSRecord.NAICSType.NAICSDepartmentRelationships.map((relationshipObj) => {
                            return {
                                id: relationshipObj.DepartmentType.id,
                                name: relationshipObj.DepartmentType.name,
                            };
                        }),
                };
            });

            callback(null, finalResponse);
        })
        .catch(callback);
};
