import httpStatus from 'http-status';
import * as _ from 'lodash';
import async from 'async';
import db from '../../config/sequelize';

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
} = db;

/**
 * Create new building permit
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

        BuildingPermits.create(payload)
            .then((createdRecord) => {
                return res.json(createdRecord);
            })
            .catch(() => {
                const e = new Error('An error occurred while posting the form');
                e.status = httpStatus.INTERNAL_SERVER_ERROR;
                return next(e);
            });
    });
}

/**
 * Update existing building permit
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function update(req, res, next) {
    // const { user } = req;
    // user.username = req.body.username;
    // user.mobileNumber = req.body.mobileNumber;
    //
    // user.save()
    //     .then((savedUser) => res.json(savedUser))
    //     .catch((e) => next(e));
}

/**
 * get specific building permit
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function get(req, res, callback) {
    // return res.json(req.user);
}


export default {
    get, create, update,
};

const validateCreatePayload = (payload, callback) => {
    async.waterfall([
        (cb) => {
            if (!_.isEmpty(payload.buildingType)) {
                return BuildingType.findAll({ where: { id: payload.buildingType } })
                    .then((types) => {
                        if (_.isEmpty(types) || types.length !== payload.buildingType.length) {
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
            if (!_.isEmpty(payload.mechanicalType)) {
                return MechanicalType.findAll({ where: { id: payload.mechanicalType } })
                    .then((types) => {
                        if (_.isEmpty(types) || types.length !== payload.mechanicalType.length) {
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
            if (!_.isEmpty(payload.indentifications)) {
                const identificationIds = payload.indentifications.map((item) => item.identificationTypeId);

                return IdentificationType.findAll({ where: { id: identificationIds } })
                    .then((types) => {
                        if (_.isEmpty(types) || types.length !== payload.indentifications.length) {
                            return cb('The identification array has incorrect identification type value');
                        }

                        Identification.bulkCreate(payload.indentifications)
                            .then((createdRecords) => {
                                payload.indentificationIds = createdRecords.map((obj) => obj.id);
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
    ], (waterfallErr) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }

        return callback();
    });
};
