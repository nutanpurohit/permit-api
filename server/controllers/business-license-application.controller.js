import httpStatus from 'http-status';
import * as _ from 'lodash';
import async from 'async';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';
import businessLicenseStatusMapping from '../dataFiles/businessLicenseStatusMapping';

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
            getAllWhereCondition(req.query, (err, whereCondition) => {
                if (err) {
                    const e = new Error(queryValidationErr);
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
                    const updates = { applicationStatusId };

                    const updateOption = {
                        where: {
                            id: applicationId,
                        },
                    };

                    BusinessLicenseApplication.update(updates, updateOption)
                        .then(() => {
                            done();
                        })
                        .catch(done);
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
                        .catch(done);
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
            if (status !== 'Agency Review') {
                return cb(null, processingData);
            }

            FormNAICSRelationship.findAll({
                where: { applicationFormId: applicationId, applicationFormType: 'businessLicense' },
                include: [
                    {
                        model: NAICSType,
                        include: [{ model: NAICSDepartmentRelationship }],
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
        (processingData, cb) => {
            const bulkCreateObj = [];
            processingData.formNAICSRelationships.forEach((formNAICSRelationship) => {
                const NAICSDepartmentRelationships = formNAICSRelationship.NAICSType ? formNAICSRelationship.NAICSType.NAICSDepartmentRelationships : [];
                NAICSDepartmentRelationships.forEach((NAICSDepartmentRelationshipObj) => {
                    const duplicateRecord = bulkCreateObj.find((createObj) => createObj.departmentId === NAICSDepartmentRelationshipObj.departmentId);
                    if (!duplicateRecord) {
                        bulkCreateObj.push({
                            applicationFormId: applicationId,
                            departmentId: NAICSDepartmentRelationshipObj.departmentId,
                        });
                    }
                });
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

const getAllWhereCondition = (query, callback) => {
    const whereCondition = {};

    // async.waterfall([
    //     (cb) => {
    //         if (!query.claim) {
    //             return cb();
    //         }
    //
    //         const claimObj = businessLicenseStatusMapping[query.claim];
    //         if (!claimObj) {
    //             return cb('The user is not allowed to view the business license application forms');
    //         }
    //
    //         if (!claimObj.agencyReview) {
    //             whereCondition.applicationStatusId = claimObj.allowedStatusIds;
    //             return cb();
    //         }
    //
    //
    //     },
    // ], () => {
    //
    // });


    callback(null, whereCondition);
};
