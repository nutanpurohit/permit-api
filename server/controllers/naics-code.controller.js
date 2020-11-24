import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';

const { Op } = Sequelize;

const {
    NAICSType,
} = db;

function get(req, res, next) {
    const naicsId = req.params.id;
    getNAICS(naicsId, (err, response) => {
        if (err) {
            return next(err);
        }
        return res.json(response);
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
        limit = 10000,
        start = 0,
        sortColumn = 'NAICSGroup',
        sortBy = 'ASC',
    } = req.query;
    const offset = start;

    const whereCondition = getAllWhereCondition(req.query);
    async.waterfall([
        (cb) => {
            async.parallel({
                NAICSTypeRecords: (done) => {
                    NAICSType.findAll({
                        where: whereCondition,
                        offset,
                        limit,
                        order: [
                            [sortColumn, sortBy.toUpperCase()],
                        ],
                        raw: true,
                    })
                        .then((types) => {
                            const grouped = _.groupBy(types, (type) => {
                                return type.NAICSGroup;
                            });
                            return done(null, grouped);
                        })
                        .catch(done);
                },
                total: (done) => {
                    NAICSType.count({
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
                    NAICSTypes: parallelRes.NAICSTypeRecords,
                    total: parallelRes.total,
                };

                return cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }

        const response = {
            NAICSTypes: processingData.NAICSTypes,
            total: processingData.total,
        };
        return res.json(response);
    });
}

function create(req, res, next) {
    const payload = req.body;

    validateNaicsPayload(payload, (err) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }
        payload.status = 'Active';

        async.waterfall([
            (cb) => {
                NAICSType.findOne({ where: { code: payload.code } })
                    .then((duplicateRecord) => {
                        if (_.isEmpty(duplicateRecord)) {
                            return cb();
                        }

                        const e = new Error(`The NAICS code already exist for ${payload.code}`);
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    })
                    .catch(cb);
            },
            (cb) => {
                NAICSType.create(payload)
                    .then((createdRecord) => {
                        cb(null, createdRecord);
                    })
                    .catch(cb);
            },
        ], (waterFallErr, createdRecord) => {
            if (waterFallErr) {
                return next(waterFallErr);
            }
            return res.json(createdRecord);
        });
    });
}

function deleteNaics(req, res, next) {
    const { id } = req.params;

    NAICSType.destroy({ where: { id } })
        .then(() => {
            return res.json({
                status: 'NAICS record deleted successfully',
            });
        })
        .catch(next);
}

function updateNAICS(req, res, next) {
    const payload = req.body;
    const naicsId = req.params.id;
    validateNaicsPayload(payload, (err) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        async.waterfall([
            (cb) => {
                const updateOption = {
                    [Op.and]: [
                        {
                            code: payload.code,
                        },
                        {
                            id: { [Op.ne]: naicsId },
                        },
                    ],
                };

                NAICSType.findOne({ where: updateOption })
                    .then((duplicateRecord) => {
                        if (_.isEmpty(duplicateRecord)) {
                            return cb();
                        }

                        const e = new Error(`The NAICS code already exist for ${payload.code}`);
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    })
                    .catch(cb);
            },
            (cb) => {
                const updates = { ...payload };
                delete updates.naicsId;

                const updateOption = {
                    where: {
                        id: naicsId,
                    },
                };

                NAICSType.update(updates, updateOption)
                    .then(() => {
                        getNAICS(naicsId, (err, response) => {
                            if (err) {
                                return next(err);
                            }
                            return res.json(response);
                        });
                    })
                    .catch(() => {
                        const e = new Error('An error occurred while updating the NAICS');
                        e.status = httpStatus.INTERNAL_SERVER_ERROR;
                        return next(e);
                    });
            },
        ], (waterFallErr, updatedRecord) => {
            if (waterFallErr) {
                return next(waterFallErr);
            }
            return res.json(updatedRecord);
        });
    });
}

function updateNAICSStatus(req, res, next) {
    const payload = req.body;
    const naicsId = req.params.id;

    async.waterfall([
        (cb) => {
            const updates = { ...payload };
            delete updates.naicsId;

            const updateOption = {
                where: {
                    id: naicsId,
                },
            };
            NAICSType.update(updates, updateOption)
                .then(() => {
                    getNAICS(naicsId, (err, response) => {
                        if (err) {
                            return next(err);
                        }
                        return res.json(response);
                    });
                })
                .catch(() => {
                    const e = new Error('An error occurred while updating the NAICS Status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return next(e);
                });
        },
    ], (waterFallErr, updatedRecord) => {
        if (waterFallErr) {
            return next(waterFallErr);
        }
        return res.json(updatedRecord);
    });
}

export default {
    get, getAll, create, deleteNaics, updateNAICS, updateNAICSStatus,
};

const validateGetAllQuery = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
    const allowedSortingColumn = [
        'id',
        'sequenceNo',
        'shortCode',
        'NAICSGroup',
        'code',
        'title',
        'year',
        'status',
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

const getAllWhereCondition = (query) => {
    const whereCondition = {};

    if (query.id) {
        whereCondition.id = query.id;
    }
    if (query.shortCode) {
        whereCondition.shortCode = {
            [Op.like]: `%${query.shortCode}%`,
        };
    }
    if (query.NAICSGroup) {
        whereCondition.NAICSGroup = {
            [Op.like]: `%${query.NAICSGroup}%`,
        };
    }
    if (query.code) {
        whereCondition.code = {
            [Op.like]: `%${query.code}%`,
        };
    }
    if (query.title) {
        whereCondition.title = {
            [Op.like]: `%${query.title}%`,
        };
    }
    if (query.permitNo) {
        whereCondition.permitNo = {
            [Op.like]: `%${query.permitNo}%`,
        };
    }
    if (query.status) {
        whereCondition.status = {
            [Op.like]: `%${query.status}%`,
        };
    }
    if (query.year) {
        whereCondition.year = query.year;
    }

    return whereCondition;
};

const validateNaicsPayload = (payload, callback) => {
    const {
        sequenceNo, shortCode,
        NAICSGroup,
        code,
        title,
        year,
    } = payload;

    if (
        !sequenceNo || _.isEmpty(shortCode)
        || _.isEmpty(NAICSGroup) || _.isEmpty(code)
        || _.isEmpty(title) || !year
    ) {
        return callback('Either sequenceNo, shortCode, NAICSGroup, code, title or year is missing');
    }

    if (shortCode.length !== 2) {
        return callback('short code should be only 2 characters');
    }

    if (code.length !== 4) {
        return callback('code should be only 4 characters');
    }

    return callback();
};

const getNAICS = (naicsId, callback) => {
    async.waterfall([
        // find form details
        (cb) => {
            let NAICSData = {};
            NAICSType.findOne({
                where: { id: naicsId },
            })
                .then((result) => {
                    console.log(result);
                    if (_.isEmpty(result.dataValues)) {
                        const e = new Error('The NAICS with the given id do not exist');
                        e.status = httpStatus.NOT_FOUND;
                        return cb(e);
                    }

                    NAICSData = result;
                    return cb(null, NAICSData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the NAICS details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },

    ], (waterfallErr, NAICSData) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }
        delete NAICSData.id;
        delete NAICSData.sequenceNo;
        delete NAICSData.shortCode;
        delete NAICSData.NAICSGroup;
        delete NAICSData.code;
        delete NAICSData.title;
        delete NAICSData.year;
        delete NAICSData.status;
        callback(null, NAICSData);
    });
};
