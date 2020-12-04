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
    BusinessLicenseStateTransition,
    BusinessLicenseAgencyReview,
    DepartmentDivision,
    DepartmentAllowedFormStatus,
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
    payload.applicantId = _.get(req, 'authentication.jwt.payload.sub', null);

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
            getAllWhereCondition(req, (err, whereCondition) => {
                if (err) {
                    const e = new Error(err);
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }
                return cb(null, whereCondition);
            });
        },
        (whereCondition, cb) => {
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
                        .then((records) => {
                            return done(null, records);
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

        async.waterfall([
            (cb) => {
                if (_.isEmpty(payload.naicsIds)) {
                    return cb();
                }
                FormNAICSRelationship.findAll({
                    where: { applicationFormId, applicationFormType: 'businessLicense' },
                })
                    .then((formNAICSRelationships) => {
                        // if there was no any NAICS for this form then simply save that in next step
                        if (_.isEmpty(formNAICSRelationships)) {
                            return cb();
                        }

                        // if the previous and current NAICS is same just ignore it
                        if (formNAICSRelationships[0].naicsId == payload.naicsIds[0]) {
                            return cb();
                        }

                        async.parallel({
                            deleteExistingNAICS: (done) => {
                                FormNAICSRelationship.destroy({
                                    where: { applicationFormId, applicationFormType: 'businessLicense', naicsId: formNAICSRelationships[0].naicsId },
                                })
                                    .then(() => {
                                        done();
                                    })
                                    .catch(done);
                            },
                            addNewNAICS: (done) => {
                                FormNAICSRelationship.create({
                                    naicsId: payload.naicsIds[0],
                                    applicationFormId,
                                    applicationFormType: 'businessLicense',
                                })
                                    .then(() => {
                                        done();
                                    })
                                    .catch(done);
                            },
                        }, (parallelErr) => {
                            if (parallelErr) {
                                return cb(parallelErr);
                            }
                            return cb();
                        });
                    })
                    .catch(cb);
            },
            (cb) => {
                BusinessLicenseApplication.update(updates, updateOption)
                    .then(() => {
                        getCompleteLicenseApplicationForm(applicationFormId, (err, response) => {
                            if (err) {
                                return cb(err);
                            }

                            return cb(null, response);
                        });
                    })
                    .catch(() => {
                        const e = new Error('An error occurred while updating the business license application form');
                        e.status = httpStatus.INTERNAL_SERVER_ERROR;
                        return cb(e);
                    });
            },
        ], (err, response) => {
            if (err) {
                return next(err);
            }

            return res.json(response.applicationForm);
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
        limit = 100000,
        start = 0,
        sortColumn = 'id',
        sortBy = 'DESC',
    } = req.query;
    const offset = start;

    const projection = businessLicenseProjection();

    const whereCondition = getGlobalSearchWhereCondition(searchText);
    async.waterfall([
        (cb) => {
            getAllWhereCondition(req, (err, queryParamWhereCondition) => {
                if (err) {
                    const e = new Error(err);
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }
                return cb(null, queryParamWhereCondition);
            });
        },
        (queryParamWhereCondition, cb) => {
            async.parallel({
                businessLicenseApplications: (done) => {
                    BusinessLicenseApplication.findAll({
                        where: {
                            [Op.and]: [
                                queryParamWhereCondition,
                                whereCondition,
                            ],
                        },
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
                        where: {
                            [Op.and]: [
                                queryParamWhereCondition,
                                whereCondition,
                            ],
                        },
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

function changeApplicationStatus(req, res, next) {
    const payload = req.body;
    const applicationId = req.params.id;

    processChangeApplicationStatus(applicationId, payload, (validateErr) => {
        if (validateErr) {
            return next(validateErr);
        }

        return res.json({
            status: 'Application status updated successfully',
        });
    });
}

export default {
    get,
    create,
    getAll,
    updateApplicationForm,
    globalSearch,
    changeApplicationStatus,
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
    let applicationForm;
    async.waterfall([
        (cb) => {
            BusinessLicenseApplication.findOne({
                where: { id: formId },
            })
                .then((applicationFormRecord) => {
                    if (_.isEmpty(applicationFormRecord)) {
                        return cb('The given business license application form do not exist');
                    }
                    applicationForm = applicationFormRecord;
                    cb();
                })
                .catch(() => {
                    return cb('something went wrong while finding the business license application form');
                });
        },
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
                return cb(null, {});
            }

            ApplicationStatusType.findByPk(payload.applicationStatusId)
                .then((types) => {
                    if (_.isEmpty(types)) {
                        return cb('The application status type value is incorrect');
                    }
                    cb(null, types);
                })
                .catch(() => {
                    return cb('something went wrong while checking application status type');
                });
        },
        // if application status is Submitted we need to add the submittedOn date
        (applicationStatusType, cb) => {
            if (_.isEmpty(applicationStatusType) || applicationStatusType.name !== 'Submitted') {
                return cb();
            }

            payload.submittedOn = new Date();
            return cb();
        },
        // set the status change date if the past and current status is not same
        // or user did some correction on the application form
        (cb) => {
            if (
                payload.applicationStatusId
                && applicationForm.applicationStatusId != payload.applicationStatusId
            ) {
                payload.statusChangeDate = new Date();
                return cb();
            }
            if (
                applicationForm.isCorrectionRequired
                && payload.isCorrected
            ) {
                payload.statusChangeDate = new Date();
                return cb();
            }

            return cb();
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
                            unread: formComments.filter((comment) => !comment.readStatus).length,
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

const processChangeApplicationStatus = (applicationId, payload, callback) => {
    const { applicationStatusId } = payload;
    if (!applicationStatusId) {
        const e = new Error('The application status is not set');
        e.status = httpStatus.NOT_FOUND;
        return callback(e);
    }

    async.waterfall([
        // validate the form exist
        (cb) => {
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

                    const processingData = { applicationForm };
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the business license application form details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // check that the application status type exist
        (processingData, cb) => {
            ApplicationStatusType.findOne({
                where: { id: applicationStatusId },
            })
                .then((statusType) => {
                    if (_.isEmpty(statusType)) {
                        const e = new Error('The application status type do not exist');
                        e.status = httpStatus.NOT_FOUND;
                        return cb(e);
                    }

                    processingData.statusType = statusType;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the application status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the recent application status that was transit
        (processingData, cb) => {
            BusinessLicenseStateTransition.findAll({
                where: { applicationFormId: applicationId },
                limit: 1,
                order: [['stateChangeDate', 'DESC']],
            })
                .then((lastApplicationStates) => {
                    let fromState = null;
                    if (!_.isEmpty(lastApplicationStates)) {
                        fromState = lastApplicationStates[0].toState;
                    }

                    processingData.fromState = fromState;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the application status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // update the state of application form as well the state transition table
        (processingData, cb) => {
            async.parallel({
                update_application: (done) => {
                    const updates = { };
                    if (
                        payload.applicationStatusId
                        && processingData.applicationForm.applicationStatusId != payload.applicationStatusId
                    ) {
                        updates.statusChangeDate = new Date();
                    }
                    // if the status is "DRT BLB Request Correction" we do not change the status of application
                    // instead we need to set the isCorrectionRequired property to true
                    const status = processingData.statusType.name;
                    if (status === 'DRT BLB Request Correction') {
                        updates.isCorrectionRequired = true;
                        updates.statusChangeDate = new Date();
                        updates.isCorrected = false;
                    } else {
                        updates.applicationStatusId = applicationStatusId;
                        updates.isCorrectionRequired = null;
                        updates.isCorrected = null;
                    }

                    const updateOption = {
                        where: {
                            id: applicationId,
                        },
                    };

                    BusinessLicenseApplication.update(updates, updateOption)
                        .then(() => {
                            done();
                        })
                        .catch((err) => {
                            done(err);
                        });
                },
                insert_state_transition: (done) => {
                    const createObj = {
                        applicationFormId: applicationId,
                        fromState: processingData.fromState,
                        toState: applicationStatusId,
                        stateChangeDate: new Date(),
                    };
                    BusinessLicenseStateTransition.create(createObj)
                        .then(() => {
                            done();
                        })
                        .catch((err) => {
                            done(err);
                        });
                },
            }, (parallelErr) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                return cb(null, processingData);
            });
        },
        // if the status is "Agency Review" we need to insert the records for agency reviewing the application
        (processingData, cb) => {
            const status = processingData.statusType.name;
            processingData.formNAICSRelationships = [];
            if (status !== 'Agency Review') {
                return cb(null, processingData);
            }

            FormNAICSRelationship.findAll({
                where: { applicationFormId: applicationId, applicationFormType: 'businessLicense' },
                include: [
                    {
                        model: NAICSType,
                        attributes: ['id', 'code', 'codeText', 'codeLength', 'codeParent'],
                        include: [{
                            model: NAICSType,
                            as: 'parentNAICS',
                            attributes: ['id', 'code', 'codeText', 'codeLength', 'codeParent'],
                            include: [{
                                model: NAICSType,
                                as: 'parentNAICS',
                                attributes: ['id', 'code', 'codeText', 'codeLength', 'codeParent'],
                                include: [{
                                    model: NAICSType,
                                    as: 'parentNAICS',
                                    attributes: ['id', 'code', 'codeText', 'codeLength', 'codeParent'],
                                }],
                            }],
                        }],
                    },
                ],
            })
                .then((formNAICSRelationships) => {
                    processingData.formNAICSRelationships = formNAICSRelationships;
                    return cb(null, processingData);
                })
                .catch((err) => {
                    return cb(err);
                });
        },
        // find all the department linked to the NAICS id
        (processingData, cb) => {
            if (_.isEmpty(processingData.formNAICSRelationships)) {
                return cb(null, processingData);
            }
            const naicsIds = [];
            processingData.formNAICSRelationships.forEach((formNAICSRelationship) => {
                const naicsId = _.get(formNAICSRelationship, 'NAICSType.parentNAICS.parentNAICS.parentNAICS.id', null);
                if (naicsId && !naicsIds.includes(naicsId)) {
                    naicsIds.push(naicsId);
                }
            });

            processingData.naicsIds = naicsIds;
            if (_.isEmpty(naicsIds)) {
                return cb(null, processingData);
            }

            NAICSDepartmentRelationship.findAll({
                where: { naicsId: naicsIds },
            })
                .then((naicsDepartmentRelationships) => {
                    processingData.naicsDepartmentRelationships = naicsDepartmentRelationships;
                    return cb(null, processingData);
                })
                .catch((err) => {
                    return cb(err);
                });
        },
        (processingData, cb) => {
            if (_.isEmpty(processingData.naicsDepartmentRelationships)) {
                return cb();
            }

            const bulkCreateObj = [];
            processingData.naicsDepartmentRelationships.forEach((NAICSDepartmentRelationshipObj) => {
                const duplicateRecord = bulkCreateObj.find((createObj) => createObj.departmentId === NAICSDepartmentRelationshipObj.departmentId);
                if (!duplicateRecord) {
                    bulkCreateObj.push({
                        applicationFormId: applicationId,
                        departmentId: NAICSDepartmentRelationshipObj.departmentId,
                        reviewStatus: 11,
                    });
                }
            });

            BusinessLicenseAgencyReview.bulkCreate(bulkCreateObj)
                .then(() => {
                    cb();
                })
                .catch(cb);
        },
    ], (waterfallErr, waterfallResponse) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }

        return callback(null, waterfallResponse);
    });
};

const getAllWhereCondition = (req, callback) => {
    const { query } = req;
    let whereCondition = {
        [Op.or]: [],
    };
    async.waterfall([
        (cb) => {
            const { claimType, claimValue, formFor } = query;
            if (!claimType || !claimValue) {
                return cb();
            }

            if (claimType === 'reviewer') {
                return DepartmentDivision.findOne(
                    { where: { claim: claimValue } },
                )
                    .then((departmentDivision) => {
                        if (_.isEmpty(departmentDivision)) {
                            return cb('The reviewer does not exist in the system');
                        }
                        DepartmentAllowedFormStatus.findOne(
                            { where: { departmentDivisionId: departmentDivision.id, departmentId: departmentDivision.departmentId } },
                        )
                            .then((allowedFormStatus) => {
                                if (_.isEmpty(allowedFormStatus)) {
                                    return cb();
                                }
                                if (allowedFormStatus.allowedUnAssignedApplicationStatusIds) {
                                    whereCondition[Op.or].push({
                                        applicationStatusId: allowedFormStatus.allowedUnAssignedApplicationStatusIds,
                                        isCorrectionRequired: true,
                                    });
                                }
                                if (formFor && formFor === 'assigned') {
                                    whereCondition[Op.or].push({ applicationStatusId: allowedFormStatus.allowedAssignedApplicationStatusIds });
                                } else if (formFor && formFor === 'unassigned') {
                                    whereCondition[Op.or].push({ applicationStatusId: allowedFormStatus.allowedUnAssignedApplicationStatusIds });
                                } else {
                                    whereCondition[Op.or].push({ applicationStatusId: allowedFormStatus.allowedApplicationStatusIds });
                                }
                                cb();
                            })
                            .catch(() => {
                                return cb('something went wrong while finding allowed form status for the department division');
                            });
                    })
                    .catch(() => {
                        return cb('something went wrong while checking department divisions');
                    });
            }

            if (claimType === 'department') {
                return DepartmentType.findOne(
                    { where: { claim: claimValue } },
                )
                    .then((department) => {
                        if (_.isEmpty(department)) {
                            return cb('The department does not exist in the system');
                        }
                        DepartmentAllowedFormStatus.findOne(
                            { where: { departmentDivisionId: { [Op.eq]: null }, departmentId: department.id } },
                        )
                            .then((allowedFormStatus) => {
                                if (_.isEmpty(allowedFormStatus)) {
                                    return cb();
                                }
                                if (allowedFormStatus.allowedUnAssignedApplicationStatusIds) {
                                    whereCondition[Op.or].push({
                                        applicationStatusId: allowedFormStatus.allowedUnAssignedApplicationStatusIds,
                                        isCorrectionRequired: true,
                                    });
                                }
                                if (formFor && formFor === 'assigned') {
                                    whereCondition[Op.or].push({ applicationStatusId: allowedFormStatus.allowedAssignedApplicationStatusIds });
                                } else if (formFor && formFor === 'unassigned') {
                                    whereCondition[Op.or].push({ applicationStatusId: allowedFormStatus.allowedUnAssignedApplicationStatusIds });
                                } else {
                                    whereCondition[Op.or].push({ applicationStatusId: allowedFormStatus.allowedApplicationStatusIds });
                                }
                                cb();
                            })
                            .catch(() => {
                                return cb('something went wrong while finding allowed form status for the department division');
                            });
                    })
                    .catch(() => {
                        return cb('something went wrong while checking department divisions');
                    });
            }

            if (claimType === 'applicant') {
                whereCondition = {
                    applicantId: _.get(req, 'authentication.jwt.payload.sub', null),
                };
                return cb();
            }
        },
    ], (err) => {
        if (err) {
            return callback(err);
        }
        callback(null, whereCondition);
    });
};
