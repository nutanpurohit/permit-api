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
} = db;

const PREFIX = 'P';

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

    // eslint-disable-next-line no-use-before-define
    getCompletePermitForm(permitId, (err, response) => {
        if (err) {
            return next(err);
        }

        return res.json(response.permitForm);
    });
}


export default {
    get, create, updatePermitByStaff, updatePermit,
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
            if (!payload.applicationStatusId || (permitForm.permitNo && permitForm.buildingPermitNo)) {
                return cb();
            }

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
                latestBuildingPermit: (done) => {
                    BuildingPermits.findAll({
                        where: {
                            fiscalYear: {
                                [Op.ne]: null,
                            },
                            sequentialNo: {
                                [Op.ne]: null,
                            },
                        },
                        limit: 1,
                        attributes: ['id', 'fiscalYear', 'sequentialNo'],
                        order: [['createdAt', 'DESC']],
                    })
                        .then((buildingPermits) => {
                            const buildingPermit = _.isEmpty(buildingPermits) ? {} : buildingPermits[0];
                            return done(null, buildingPermit);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelResult) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }

                const { applicationStatusType, latestBuildingPermit } = parallelResult;

                if (applicationStatusType.name.toLowerCase() !== 'approved') {
                    return cb();
                }
                let sequenceNumber = '0001';
                const fiscalYear = getFiscal();
                payload.sequentialNo = 1;
                payload.fiscalYear = fiscalYear;

                if (!_.isEmpty(latestBuildingPermit)) {
                    // if fiscal year is changed reset sequence no
                    if (latestBuildingPermit.fiscalYear === fiscalYear) {
                        sequenceNumber = (`0000${latestBuildingPermit.sequentialNo + 1}`).substr(-4, 4);
                        payload.sequentialNo = latestBuildingPermit.sequentialNo + 1;
                    }
                }

                payload.permitNo = `${PREFIX}${fiscalYear}${sequenceNumber}`;
                payload.buildingPermitNo = `${PREFIX}${fiscalYear}${sequenceNumber}`;

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

const getFiscal = () => {
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
