import httpStatus from 'http-status';
import * as _ from 'lodash';
import async from 'async';
import moment from 'moment';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';

const { Op } = Sequelize;

const {
    BuildingType,
    IdentificationType,
    MechanicalType,
    NonResidential,
    PrincipleFameType,
    Residential,
    SewageDisposalType,
    WaterSupplyType,
    OwnershipType,
    Identification,
    BuildingPermits,
    AgencyComments,
    AgencyType,
    PlanReview,
    PlanReviewType,
    ApplicationStatusType,
    CostType,
    CostBuildingPermit,
    FormConfig,
    FormComment,
} = db;

/**
 * Create new building permit
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function create(req, res, next) {
    let payload = req.body;
    payload = removeRestrictedFields(payload);

    // eslint-disable-next-line no-use-before-define
    validateCreatePayload(payload, (validationErr) => {
        if (validationErr) {
            const e = new Error(validationErr);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        BuildingPermits.create(payload)
            .then((createdRecord) => {
                // eslint-disable-next-line no-use-before-define
                getCompletePermitForm(createdRecord.id, (err, response) => {
                    if (err) {
                        return next(err);
                    }

                    return res.json(response.permitForm);
                });
            })
            .catch(() => {
                const e = new Error('An error occurred while posting the form');
                e.status = httpStatus.INTERNAL_SERVER_ERROR;
                return next(e);
            });
    });
}

/**
 * update the building permit record by the staff users
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function updatePermitByStaff(req, res, next) {
    const payload = req.body;
    const permitFormId = req.params.id;

    // eslint-disable-next-line no-use-before-define
    validateCreateForStaffPayload(permitFormId, payload, (validationErr) => {
        if (validationErr) {
            const e = new Error(validationErr);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        const updates = { ...payload };
        delete updates.permitFormId;

        const updateOption = {
            where: {
                id: permitFormId,
            },
        };

        BuildingPermits.update(updates, updateOption)
            .then(() => {
                // eslint-disable-next-line no-use-before-define
                getCompletePermitForm(permitFormId, (err, response) => {
                    if (err) {
                        return next(err);
                    }

                    return res.json(response.permitForm);
                });
            })
            .catch(() => {
                const e = new Error('An error occurred while updating the permit form');
                e.status = httpStatus.INTERNAL_SERVER_ERROR;
                return next(e);
            });
    });
}

/**
 * update the building permit record
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function updatePermit(req, res, next) {
    const payload = req.body;
    const permitFormId = req.params.id;

    // eslint-disable-next-line no-use-before-define
    validateUpdatePayload(permitFormId, payload, (validationErr) => {
        if (validationErr) {
            const e = new Error(validationErr);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        const updates = { ...payload };
        delete updates.permitFormId;

        const updateOption = {
            where: {
                id: permitFormId,
            },
        };

        BuildingPermits.update(updates, updateOption)
            .then(() => {
                // eslint-disable-next-line no-use-before-define
                getCompletePermitForm(permitFormId, (err, response) => {
                    if (err) {
                        return next(err);
                    }

                    return res.json(response.permitForm);
                });
            })
            .catch(() => {
                const e = new Error('An error occurred while updating the permit form');
                e.status = httpStatus.INTERNAL_SERVER_ERROR;
                return next(e);
            });
    });
}

/**
 * get specific building permit
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function get(req, res, next) {
    const permitId = req.params.id;

    getCompletePermitForm(permitId, (err, response) => {
        if (err) {
            return next(err);
        }

        return res.json(response.permitForm);
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
    const offset = start * limit;

    const projection = customerPermitFormProjection();

    const whereCondition = getAllWhereCondition(req.query);
    async.waterfall([
        (cb) => {
            async.parallel({
                buildingPermits: (done) => {
                    BuildingPermits.findAll({
                        where: whereCondition,
                        attributes: projection,
                        offset,
                        limit,
                        order: [
                            [sortColumn, sortBy.toUpperCase()],
                        ],
                    })
                        .then((buildingPermits) => {
                            return done(null, buildingPermits);
                        })
                        .catch(done);
                },
                total: (done) => {
                    BuildingPermits.count({
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
                    buildingPermits: parallelRes.buildingPermits,
                    total: parallelRes.total,
                };

                return cb(null, processingData);
            });
        },
        (processingData, cb) => {
            processingData.completeCustomerPermitForm = [];

            async.eachSeries(processingData.buildingPermits, (buildingPermit, eachCb) => {
                getCompleteCustomerPermitForm(buildingPermit.id, (err, response) => {
                    if (err) {
                        return eachCb(err);
                    }

                    processingData.completeCustomerPermitForm.push(response.permitForm);
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
            buildingPermits: processingData.completeCustomerPermitForm,
            total: processingData.total,
        };
        return res.json(response);
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
    const offset = start * limit;

    const projection = customerPermitFormProjection();

    const whereCondition = getGlobalSearchWhereCondition(searchText);
    async.waterfall([
        (cb) => {
            async.parallel({
                buildingPermits: (done) => {
                    BuildingPermits.findAll({
                        where: whereCondition,
                        attributes: projection,
                        offset,
                        limit,
                        order: [
                            [sortColumn, sortBy.toUpperCase()],
                        ],
                    })
                        .then((buildingPermits) => {
                            return done(null, buildingPermits);
                        })
                        .catch(done);
                },
                total: (done) => {
                    BuildingPermits.count({
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
                    buildingPermits: parallelRes.buildingPermits,
                    total: parallelRes.total,
                };

                return cb(null, processingData);
            });
        },
        (processingData, cb) => {
            processingData.completeCustomerPermitForm = [];

            async.eachSeries(processingData.buildingPermits, (buildingPermit, eachCb) => {
                getCompleteCustomerPermitForm(buildingPermit.id, (err, response) => {
                    if (err) {
                        return eachCb(err);
                    }

                    processingData.completeCustomerPermitForm.push(response.permitForm);
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
            buildingPermits: processingData.completeCustomerPermitForm,
            total: processingData.total,
        };
        return res.json(response);
    });
}

export default {
    get,
    create,
    updatePermitByStaff,
    updatePermit,
    getAll,
    globalSearch,
};

const validateCreatePayload = (payload, callback) => {
    async.waterfall([
        (cb) => {
            if (!_.isEmpty(payload.buildingType)) {
                return BuildingType.findAll({ where: { id: payload.buildingType } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The building type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking building types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.ownership) {
                return OwnershipType.findByPk(payload.ownership)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The ownership type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking ownership types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.residential) {
                return Residential.findByPk(payload.residential)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The residential type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking residential types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.nonResidential) {
                return NonResidential.findByPk(payload.nonResidential)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The non-residential type value is incorrect');
                        }
                        return cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking non-residential types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.principalTypeOfFrame) {
                return PrincipleFameType.findByPk(payload.principalTypeOfFrame)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The principal type of fame value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking principal type of fame types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.sewageDisposalType) {
                return SewageDisposalType.findByPk(payload.sewageDisposalType)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The type of sewage disposal value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking type of sewage disposal');
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
            if (!_.isEmpty(payload.mechanicalType)) {
                return MechanicalType.findAll({ where: { id: payload.mechanicalType } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The mechanical type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking mechanical type');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.waterSupplyType) {
                return WaterSupplyType.findByPk(payload.waterSupplyType)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The type of water supply value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking type of water supply');
                    });
            }
            cb();
        },
        (cb) => {
            if (!_.isEmpty(payload.identifications)) {
                const identificationIds = payload.identifications.map((item) => item.identificationTypeId);

                return IdentificationType.findAll({ where: { id: identificationIds } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The identification array has incorrect identification type value');
                        }

                        Identification.bulkCreate(payload.identifications)
                            .then((createdRecords) => {
                                payload.identificationIds = createdRecords.map((obj) => obj.id);
                                cb();
                            })
                            .catch(() => {
                                return cb('something went wrong while creating the identifications');
                            });
                    })
                    .catch(() => {
                        return cb('something went wrong while checking identification types');
                    });
            }
            cb();
        },
        (cb) => {
            if (!_.isEmpty(payload.costs)) {
                const costTypeIds = payload.costs.map((item) => item.costTypeId);

                return CostType.findAll({ where: { id: costTypeIds } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The costs array has incorrect cost type value');
                        }

                        CostBuildingPermit.bulkCreate(payload.costs)
                            .then((createdRecords) => {
                                payload.costIds = createdRecords.map((obj) => obj.id);
                                cb();
                            })
                            .catch(() => {
                                return cb('something went wrong while creating the costs');
                            });
                    })
                    .catch(() => {
                        return cb('something went wrong while checking cost types');
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

const validateCreateForStaffPayload = (permitFormId, payload, callback) => {
    let permitForm;
    async.waterfall([
        (cb) => {
            BuildingPermits.findOne({ where: { id: permitFormId } })
                .then((record) => {
                    if (_.isEmpty(record)) {
                        return cb('The permit form do not exist');
                    }
                    permitForm = record;
                    cb();
                })
                .catch(() => {
                    return cb('something went wrong while finding permit form');
                });
        },
        (cb) => {
            if (!_.isEmpty(payload.planReviewRecords)) {
                const reviewTypeIds = payload.planReviewRecords.map((item) => item.planReviewTypeId);

                return PlanReviewType.findAll({ where: { id: reviewTypeIds } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The plan review records array has incorrect review type value');
                        }

                        async.eachLimit(payload.planReviewRecords, 5, (planReviewRecordObj, eachCb) => {
                            payload.planReviewIds = [];
                            if (!planReviewRecordObj.id) {
                                // create
                                PlanReview.create(planReviewRecordObj)
                                    .then((createdRecords) => {
                                        payload.planReviewIds.push(createdRecords.id);
                                        eachCb();
                                    })
                                    .catch(() => {
                                        return eachCb('something went wrong while creating the plan review comments');
                                    });
                            } else {
                                // update
                                const updatePayload = { ...planReviewRecordObj };
                                delete updatePayload.id;

                                PlanReview.update(updatePayload, { where: { id: planReviewRecordObj.id } })
                                    .then(() => {
                                        payload.planReviewIds.push(planReviewRecordObj.id);
                                        eachCb();
                                    })
                                    .catch(() => {
                                        return eachCb('something went wrong while updating the plan review record');
                                    });
                            }
                        }, (eachErr) => {
                            if (eachErr) {
                                return cb(eachErr);
                            }
                            return cb();
                        });
                    })
                    .catch(() => {
                        return cb('something went wrong while checking plan review records');
                    });
            }
            cb();
        },
        (cb) => {
            if (!_.isEmpty(payload.agencyComments)) {
                const agencyTypeIds = payload.agencyComments.map((item) => item.agencyTypeId);

                return AgencyType.findAll({ where: { id: agencyTypeIds } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The agency comments array has incorrect agency type value');
                        }

                        async.eachLimit(payload.agencyComments, 5, (agencyCommentObj, eachCb) => {
                            payload.agencyCommentIds = [];
                            if (!agencyCommentObj.id) {
                                // create
                                AgencyComments.create(agencyCommentObj)
                                    .then((createdRecords) => {
                                        payload.agencyCommentIds.push(createdRecords.id);
                                        eachCb();
                                    })
                                    .catch(() => {
                                        return eachCb('something went wrong while creating the agency comments');
                                    });
                            } else {
                                // update
                                const updatePayload = { ...agencyCommentObj };
                                delete updatePayload.id;

                                AgencyComments.update(updatePayload, { where: { id: agencyCommentObj.id } })
                                    .then(() => {
                                        payload.agencyCommentIds.push(agencyCommentObj.id);
                                        eachCb();
                                    })
                                    .catch(() => {
                                        return eachCb('something went wrong while updating the agency comment record');
                                    });
                            }
                        }, (eachErr) => {
                            if (eachErr) {
                                return cb(eachErr);
                            }
                            return cb();
                        });
                    })
                    .catch(() => {
                        return cb('something went wrong while checking agency comment types');
                    });
            }
            cb();
        },
        // generate the permit id
        (cb) => {
            // there is no application status in payload or if there is already the permit no generated then ignore
            if (!payload.applicationStatusId) {
                return cb();
            }

            getRelatedData(payload, (parallelErr, parallelResult) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }

                const { applicationStatusType, formConfig } = parallelResult;
                const statusName = applicationStatusType.name.toLowerCase();

                // we update permit number and Building permit number on approved
                if (statusName === 'approved') {
                    const permitNoConfig = formConfig.find((config) => config.formField === 'permitNo');
                    const buildingPermitNoConfig = formConfig.find((config) => config.formField === 'buildingPermitNo');
                    if (!permitNoConfig || !buildingPermitNoConfig || permitForm.permitNo || permitForm.buildingPermitNo) {
                        return cb();
                    }

                    const permitSequenceNumber = (`0000${permitNoConfig.sequenceNo}`).substr(-4, 4);
                    const buildingPermitSequenceNumber = (`0000${buildingPermitNoConfig.sequenceNo}`).substr(-4, 4);

                    payload.permitNo = `${permitNoConfig.prefix}${permitNoConfig.fiscalYear}${permitSequenceNumber}`;
                    payload.buildingPermitNo = `${buildingPermitNoConfig.prefix}${buildingPermitNoConfig.fiscalYear}${buildingPermitSequenceNumber}`;
                    updateFormConfig(permitNoConfig.id, permitNoConfig);
                    updateFormConfig(buildingPermitNoConfig.id, buildingPermitNoConfig);
                    return cb();
                } if (statusName === 'submit') {
                    const applicationNoConfig = formConfig.find((config) => config.formField === 'applicationNo');
                    if (!applicationNoConfig || permitForm.applicationNo) {
                        return cb();
                    }

                    const sequenceNumber = (`0000${applicationNoConfig.sequenceNo}`).substr(-4, 4);

                    payload.applicationNo = `${applicationNoConfig.prefix}${applicationNoConfig.fiscalYear}${sequenceNumber}`;
                    updateFormConfig(applicationNoConfig.id, applicationNoConfig);
                    return cb();
                }
                return cb();
            });
        },
    ], (waterfallErr) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }

        return callback();
    });
};

const getCompletePermitForm = (permitId, callback) => {
    async.waterfall([
        // find form details
        (cb) => {
            const processingData = {};
            BuildingPermits.findOne({
                where: { id: permitId },
                raw: true,
            })
                .then((permitForm) => {
                    if (_.isEmpty(permitForm)) {
                        const e = new Error('The form with the given id do not exist');
                        e.status = httpStatus.NOT_FOUND;
                        return cb(e);
                    }

                    processingData.permitForm = permitForm;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the form details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the identification records for this form
        (processingData, cb) => {
            const { identificationIds } = processingData.permitForm;
            if (_.isEmpty(identificationIds)) {
                return cb(null, processingData);
            }

            Identification.findAll({ where: { id: identificationIds } })
                .then((identifications) => {
                    if (_.isEmpty(identifications) || identifications.length !== identificationIds.length) {
                        const e = new Error('Some of the identification information for this form is missing');
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    }

                    processingData.permitForm.identifications = identifications;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the identification details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the agency comments records for this form
        (processingData, cb) => {
            const { agencyCommentIds } = processingData.permitForm;
            if (_.isEmpty(agencyCommentIds)) {
                return cb(null, processingData);
            }

            AgencyComments.findAll({ where: { id: agencyCommentIds } })
                .then((agencyComments) => {
                    if (_.isEmpty(agencyComments) || agencyComments.length !== agencyCommentIds.length) {
                        const e = new Error('Some of the agency comments information for this form is missing');
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    }

                    processingData.permitForm.agencyComments = agencyComments;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the agency comments details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the plan review records for this form
        (processingData, cb) => {
            const { planReviewIds } = processingData.permitForm;
            if (_.isEmpty(planReviewIds)) {
                return cb(null, processingData);
            }

            PlanReview.findAll({ where: { id: planReviewIds } })
                .then((planReviews) => {
                    if (_.isEmpty(planReviews) || planReviews.length !== planReviewIds.length) {
                        const e = new Error('Some of the plan review comment information for this form is missing');
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    }

                    processingData.permitForm.planReviews = planReviews;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the plan review records');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the costs
        (processingData, cb) => {
            const { costIds } = processingData.permitForm;
            if (_.isEmpty(costIds)) {
                return cb(null, processingData);
            }

            CostBuildingPermit.findAll({ where: { id: costIds } })
                .then((costs) => {
                    if (_.isEmpty(costs) || costs.length !== costIds.length) {
                        const e = new Error('Some of the cost information for this form is missing');
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    }

                    processingData.permitForm.costs = costs;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the costs');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the application status
        (processingData, cb) => {
            const { applicationStatusId } = processingData.permitForm;
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

                    processingData.permitForm.applicationStatus = applicationStatusType.name;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding application status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the application comments
        (processingData, cb) => {
            const { id } = processingData.permitForm;

            FormComment.findAll({
                where: { formId: id, applicationFormType: 'buildingPermit' },
            })
                .then((formComments) => {
                    processingData.permitForm.commentsSummary = {
                        allComments: 0,
                        unread: 0,
                    };
                    if (!_.isEmpty(formComments)) {
                        processingData.permitForm.commentsSummary = {
                            allComments: formComments.length,
                            unread: formComments.filter((comment) => !comment.isPublish).length,
                        };
                    }

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

        delete processingData.permitForm.sequentialNo;
        delete processingData.permitForm.fiscalYear;
        callback(null, processingData);
    });
};

const getCompleteCustomerPermitForm = (permitId, callback) => {
    async.waterfall([
        // find form details
        (cb) => {
            const processingData = {};
            BuildingPermits.findOne({
                where: { id: permitId },
                attributes: customerPermitFormProjection(),
                raw: true,
            })
                .then((permitForm) => {
                    if (_.isEmpty(permitForm)) {
                        const e = new Error('The form with the given id do not exist');
                        e.status = httpStatus.NOT_FOUND;
                        return cb(e);
                    }

                    processingData.permitForm = permitForm;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the form details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the identification records for this form
        (processingData, cb) => {
            const { identificationIds } = processingData.permitForm;
            if (_.isEmpty(identificationIds)) {
                return cb(null, processingData);
            }

            Identification.findAll({ where: { id: identificationIds } })
                .then((identifications) => {
                    if (_.isEmpty(identifications) || identifications.length !== identificationIds.length) {
                        const e = new Error('Some of the identification information for this form is missing');
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    }

                    processingData.permitForm.identifications = identifications;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the identification details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the costs
        (processingData, cb) => {
            const { costIds } = processingData.permitForm;
            if (_.isEmpty(costIds)) {
                return cb(null, processingData);
            }

            CostBuildingPermit.findAll({ where: { id: costIds } })
                .then((costs) => {
                    if (_.isEmpty(costs) || costs.length !== costIds.length) {
                        const e = new Error('Some of the cost information for this form is missing');
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    }

                    processingData.permitForm.costs = costs;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the costs');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the application status
        (processingData, cb) => {
            const { applicationStatusId } = processingData.permitForm;
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

                    processingData.permitForm.applicationStatus = applicationStatusType.name;
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding application status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the application comments
        (processingData, cb) => {
            const { id } = processingData.permitForm;

            FormComment.findAll({
                where: { formId: id, applicationFormType: 'buildingPermit' },
            })
                .then((formComments) => {
                    processingData.permitForm.commentsSummary = {
                        allComments: 0,
                        unread: 0,
                    };
                    if (!_.isEmpty(formComments)) {
                        processingData.permitForm.commentsSummary = {
                            allComments: formComments.length,
                            unread: formComments.filter((comment) => !comment.isPublish).length,
                        };
                    }

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

        delete processingData.permitForm.sequentialNo;
        delete processingData.permitForm.fiscalYear;
        callback(null, processingData);
    });
};

const validateUpdatePayload = (permitFormId, payload, callback) => {
    async.waterfall([
        (cb) => {
            BuildingPermits.findOne({ where: { id: permitFormId } })
                .then((permitForm) => {
                    if (_.isEmpty(permitForm)) {
                        return cb('The permit form do not exist');
                    }
                    cb();
                })
                .catch(() => {
                    return cb('something went wrong while finding permit form');
                });
        },
        (cb) => {
            if (!_.isEmpty(payload.buildingType)) {
                return BuildingType.findAll({ where: { id: payload.buildingType } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The building type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking building types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.ownership) {
                return OwnershipType.findByPk(payload.ownership)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The ownership type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking ownership types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.residential) {
                return Residential.findByPk(payload.residential)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The residential type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking residential types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.nonResidential) {
                return NonResidential.findByPk(payload.nonResidential)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The non-residential type value is incorrect');
                        }
                        return cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking non-residential types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.principalTypeOfFrame) {
                return PrincipleFameType.findByPk(payload.principalTypeOfFrame)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The principal type of fame value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking principal type of fame types');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.sewageDisposalType) {
                return SewageDisposalType.findByPk(payload.sewageDisposalType)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The type of sewage disposal value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking type of sewage disposal');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.applicationStatusId) {
                return ApplicationStatusType.findByPk(payload.applicationStatusId)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The type of application status value is incorrect');
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
            if (!_.isEmpty(payload.mechanicalType)) {
                return MechanicalType.findAll({ where: { id: payload.mechanicalType } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The mechanical type value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking mechanical type');
                    });
            }
            cb();
        },
        (cb) => {
            if (payload.waterSupplyType) {
                return WaterSupplyType.findByPk(payload.waterSupplyType)
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The type of water supply value is incorrect');
                        }
                        cb();
                    })
                    .catch(() => {
                        return cb('something went wrong while checking type of water supply');
                    });
            }
            cb();
        },
        (cb) => {
            if (!_.isEmpty(payload.identifications)) {
                const identificationIds = payload.identifications.map((item) => item.identificationTypeId);

                return IdentificationType.findAll({ where: { id: identificationIds } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The identification array has incorrect identification type value');
                        }

                        async.eachLimit(payload.identifications, 5, (identificationObj, eachCb) => {
                            payload.identificationIds = [];

                            if (!identificationObj.id) {
                                // create
                                Identification.create(identificationObj)
                                    .then((createdRecords) => {
                                        payload.identificationIds.push(createdRecords.id);
                                        eachCb();
                                    })
                                    .catch(() => {
                                        return eachCb('something went wrong while creating the identification records');
                                    });
                            } else {
                                // update
                                const updatePayload = { ...identificationObj };
                                delete updatePayload.id;

                                Identification.update(updatePayload, { where: { id: identificationObj.id } })
                                    .then(() => {
                                        payload.identificationIds.push(identificationObj.id);
                                        eachCb();
                                    })
                                    .catch(() => {
                                        return eachCb('something went wrong while updating the identifications');
                                    });
                            }
                        }, (eachErr) => {
                            if (eachErr) {
                                return cb(eachErr);
                            }
                            return cb();
                        });
                    })
                    .catch(() => {
                        return cb('something went wrong while checking identification types');
                    });
            }
            cb();
        },
        (cb) => {
            if (!_.isEmpty(payload.costs)) {
                const costTypeIds = payload.costs.map((item) => item.costTypeId);

                return CostType.findAll({ where: { id: costTypeIds } })
                    .then((types) => {
                        if (_.isEmpty(types)) {
                            return cb('The costs array has incorrect cost type value');
                        }

                        async.eachLimit(payload.costs, 5, (costObj, eachCb) => {
                            payload.costIds = [];

                            if (!costObj.id) {
                                // create
                                CostBuildingPermit.create(costObj)
                                    .then((createdRecords) => {
                                        payload.costIds.push(createdRecords.id);
                                        eachCb();
                                    })
                                    .catch(() => {
                                        return eachCb('something went wrong while creating the cost records');
                                    });
                            } else {
                                // update
                                const updatePayload = { ...costObj };
                                delete updatePayload.id;

                                CostBuildingPermit.update(updatePayload, { where: { id: costObj.id } })
                                    .then(() => {
                                        payload.costIds.push(costObj.id);
                                        eachCb();
                                    })
                                    .catch(() => {
                                        return eachCb('something went wrong while updating the costs');
                                    });
                            }
                        }, (eachErr) => {
                            if (eachErr) {
                                return cb(eachErr);
                            }
                            return cb();
                        });
                    })
                    .catch(() => {
                        return cb('something went wrong while checking cost types');
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

const removeRestrictedFields = (payload) => {
    delete payload.buildingPermitNo;
    delete payload.permitNo;
    delete payload.applicationNo;
    delete payload.sequentialNo;
    delete payload.fiscalYear;

    return payload;
};

const getFiscalYear = () => {
    const currentDate = moment(new Date(), 'YYYY/MM/DD');
    const currentMonth = currentDate.format('M');
    let fiscalYear = '';
    if (currentMonth >= 10) {
        fiscalYear = currentDate.format('YYYY');
    } else {
        fiscalYear = moment(new Date()).subtract(1, 'years').format('YYYY');
    }

    return fiscalYear;
};

const getRelatedData = (payload, callback) => {
    async.parallel({
        applicationStatusType: (done) => {
            ApplicationStatusType.findByPk(payload.applicationStatusId)
                .then((applicationStatusType) => {
                    if (_.isEmpty(applicationStatusType)) {
                        return done('The application status is incorrect');
                    }

                    return done(null, applicationStatusType);
                })
                .catch(done);
        },
        formConfig: (done) => {
            FormConfig.findAll({
                where: {
                    formType: 'buildingPermit',
                    formField: ['permitNo', 'applicationNo', 'buildingPermitNo'],
                },
            })
                .then((formConfigs) => {
                    return done(null, formConfigs);
                })
                .catch(done);
        },
    }, callback);
};

const updateFormConfig = (configId, configObj) => {
    let currentFiscalYear;
    if (configObj.formField === 'permitNo') {
        currentFiscalYear = getFiscalYear();
    }
    if (configObj.formField === 'applicationNo') {
        currentFiscalYear = getFiscalYear().substr(2);
    }
    if (configObj.formField === 'buildingPermitNo') {
        currentFiscalYear = getFiscalYear().substr(2);
    }
    const updateObj = {
        sequenceNo: configObj.sequenceNo + 1,
        fiscalYear: currentFiscalYear,
    };
    FormConfig.update(updateObj, { where: { id: configId } });
};

const validateGetAllQuery = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
    const allowedSortingColumn = [
        'id',
        'permitNo',
        'applicationNo',
        'locationNo',
        'locationStreet',
        'block',
        'lotSize',
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

const customerPermitFormProjection = () => {
    const projection = [
        'id',
        'permitNo',
        'applicationNo',
        'locationNo',
        'locationStreet',
        'zoningDistrict',
        'crossStreet1',
        'crossStreet2',
        'subDivision',
        'block',
        'lotSize',
        'groupOccupancy',
        'constructionType',
        'foundation',
        'buildingType',
        'otherBuildingType',
        'buildingDimension',
        'ownership',
        'costIds',
        'otherCost',
        'improvementCostTotal',
        'nonResidentialPurpose',
        'residential',
        'residentialNoOfFamily',
        'residentialNoOfHotelMotel',
        'otherResidential',
        'nonResidential',
        'otherNonResidential',
        'principalTypeOfFrame',
        'otherPrincipalTypeOfFrame',
        'sewageDisposalType',
        'mechanicalType',
        'waterSupplyType',
        'noOfStories',
        'exteriorDimensions',
        'totalLandArea',
        'enclosedParking',
        'outdoorsParking',
        'noOfBedRoom',
        'noOfBedRoomFull',
        'noOfBedRoomPartial',
        'identificationIds',
        'ownerLesor',
        'currentAddress',
        'applicationDate',
        'createdAt',
        'updatedAt',
    ];

    return projection;
};

const getAllWhereCondition = (query) => {
    const whereCondition = {};

    if (query.id) {
        whereCondition.id = query.id;
    }
    if (query.block) {
        whereCondition.block = {
            [Op.like]: `%${query.block}%`,
        };
    }
    if (query.permitNo) {
        whereCondition.permitNo = {
            [Op.like]: `%${query.permitNo}%`,
        };
    }
    if (query.applicationNo) {
        whereCondition.applicationNo = {
            [Op.like]: `%${query.applicationNo}%`,
        };
    }

    return whereCondition;
};

const getGlobalSearchWhereCondition = (searchText) => {
    const whereCondition = {
        [Op.or]: [
            {
                id: isNaN(searchText) ? null : searchText,
            },
            {
                permitNo: { [Op.like]: `%${searchText}%` },
            },
            { applicationNo: { [Op.like]: `%${searchText}%` } },
            {
                block: {
                    [Op.like]: `%${searchText}%`,
                },
            },
            {
                groupOccupancy: {
                    [Op.like]: `%${searchText}%`,
                },
            },
        ],
    };

    return whereCondition;
};
