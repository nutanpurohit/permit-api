import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import Sequelize, { where } from 'sequelize';
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
        sortColumn = 'title',
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
                            return done(null, types);
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

function getAllForAdmin(req, res, next) {
    async.waterfall([
        (cb) => {
            async.parallel({
                NAICSTypeRecords: (done) => {
                    NAICSType.findAll({
                        where: {
                            codeLength: 2,
                        },
                        attributes: ['id', 'title', 'code', 'codeText', 'codeLength', 'codeParent'],
                        include: [{
                            model: NAICSType,
                            as: 'childNAICS',
                            attributes: ['id', 'title', 'code', 'codeText', 'codeLength', 'codeParent'],
                        }],
                        order: [
                            ['title', 'ASC'],
                        ],
                    })
                        .then((types) => {
                            return done(null, types);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                const processingData = {
                    NAICSTypes: parallelRes.NAICSTypeRecords,
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
        };
        return res.json(response);
    });
}

function getCodeOption(req, res, next) {
    const {
        code,
    } = req.params;
    async.waterfall([
        (cb) => {
            NAICSType.findOne({
                where: { code },
            }).then((codeResult) => {
                const processingData = {
                    codeSix: codeResult,
                    codeParent: _.get(codeResult, 'codeParent', null),
                };
                return cb(null, processingData);
            }).catch((err) => {
                return cb(err);
            });
        },
        (cb, processingData) => {
            return cb(null, processingData);
        },
    ], (err, processingData) => {
        if (err) {
            next(err);
        }
        res.json(processingData);
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
        payload.code = parseInt(payload.codeText);
        payload.codeLength = payload.codeText.length;

        async.waterfall([
            (cb) => {
                NAICSType.findOne({ where: { code: payload.codeText } })
                    .then((duplicateRecord) => {
                        if (_.isEmpty(duplicateRecord)) {
                            return cb();
                        }

                        const e = new Error(`The NAICS code already exist for ${payload.codeText}`);
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    })
                    .catch(cb);
            },
            (cb) => {
                NAICSType.findOne({
                    where: {
                        code: payload.codeParent,
                    },
                }).then((parentNAICS) => {
                    if (!_.isEmpty(parentNAICS)) {
                        return cb();
                    }
                    const e = new Error('The Parent NAICS code is not found');
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }).catch(cb);
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
    get, getAll, create, deleteNaics, updateNAICS, updateNAICSStatus, getCodeOption, getAllForAdmin,
};

const validateGetAllQuery = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
    const allowedSortingColumn = [
        'id',
        'code',
        'codeText',
        'codeLength',
        'codeParent',
        'title',
        'description',
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

    if (query.codeParent) {
        whereCondition.codeParent = query.codeParent;
    }
    if (query.codeLength) {
        whereCondition.codeLength = query.codeLength;
    }
    return whereCondition;
};

const validateNaicsPayload = (payload, callback) => {
    const {
        codeText,
        codeParent,
        title,
    } = payload;

    if (_.isEmpty(codeText)
        || _.isEmpty(codeParent)
        || _.isEmpty(title)
    ) {
        return callback('Either codeText, codeParent, title is missing');
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
