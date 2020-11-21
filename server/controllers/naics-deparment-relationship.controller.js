import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';

const { Op } = Sequelize;

const {
    NAICSDepartmentRelationship,
    NAICSType,
    DepartmentType,
} = db;

function getAll(req, res, next) {
    const queryValidationErr = validateGetAllQuery(req.query);

    if (queryValidationErr) {
        const e = new Error(queryValidationErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    const {
        limit = 25,
        start = 0,
        sortColumn = 'id',
        sortBy = 'DESC',
    } = req.query;

    const offset = start;
    const whereCondition = getAllWhereCondition(req.query);

    async.waterfall([
        (cb) => {
            async.parallel({
                relationships: (done) => {
                    NAICSDepartmentRelationship.findAll({
                        where: whereCondition,
                        offset,
                        limit,
                        include: [
                            { model: NAICSType },
                            { model: DepartmentType },
                        ],
                        order: [
                            [sortColumn, sortBy.toUpperCase()],
                        ],
                    })
                        .then((records) => {
                            done(null, records);
                        })
                        .catch(done);
                },
                total: (done) => {
                    NAICSDepartmentRelationship.count({
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
                    relationships: parallelRes.relationships,
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
            relationships: processingData.relationships,
            total: processingData.total,
        };
        return res.json(response);
    });
}

function create(req, res, next) {
    const payload = req.body;

    validateRelationshipPayload(payload, (err) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        async.waterfall([
            (cb) => {
                NAICSDepartmentRelationship.create(payload)
                    .then((createdRecord) => {
                        const processingData = { createdRecord };
                        cb(null, processingData);
                    })
                    .catch(cb);
            },
            (processingData, cb) => {
                const { id } = processingData.createdRecord;
                NAICSDepartmentRelationship.findOne({
                    where: { id },
                    include: [
                        { model: NAICSType },
                        { model: DepartmentType },
                    ],
                })
                    .then((record) => {
                        processingData.createdRecord = record;
                        cb(null, processingData);
                    })
                    .catch(cb);
            },
        ], (waterFallErr, processingData) => {
            if (waterFallErr) {
                return next(waterFallErr);
            }
            return res.json(processingData.createdRecord);
        });
    });
}

function updateRelationship(req, res, next) {
    const payload = req.body;
    const { id } = req.params;

    validateRelationshipUpdatePayload(payload, (err) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        async.waterfall([
            (cb) => {
                const updates = { ...payload };

                const updateOption = {
                    where: {
                        id,
                    },
                };
                NAICSDepartmentRelationship.update(updates, updateOption)
                    .then(() => {
                        cb();
                    })
                    .catch(cb);
            },
            (cb) => {
                NAICSDepartmentRelationship.findOne({
                    where: { id },
                    include: [
                        { model: NAICSType },
                        { model: DepartmentType },
                    ],
                })
                    .then((record) => {
                        const processingData ={
                            updatedRecord: record
                        };
                        cb(null, processingData);
                    })
                    .catch(cb);
            },
        ], (waterFallErr, processingData) => {
            if (waterFallErr) {
                return next(waterFallErr);
            }
            return res.json(processingData.updatedRecord);
        });
    });
}

function deleteRelationship(req, res, next) {
    const { id } = req.params;

    NAICSDepartmentRelationship.destroy({ where: { id } })
        .then(() => {
            return res.json({
                status: 'NAICS and deparment relationship record deleted successfully',
            });
        })
        .catch(next);
}

export default {
    getAll, create, deleteRelationship, updateRelationship,
};

const validateRelationshipPayload = (payload, callback) => {
    const {
        naicsId,
        departmentId,
    } = payload;

    if (!naicsId) {
        return callback('The naicsId is missing');
    }

    if (!departmentId) {
        return callback('The departmentId is missing');
    }

    async.waterfall([
        (cb) => {
            NAICSDepartmentRelationship.findOne({ where: { naicsId, departmentId } })
                .then((record) => {
                    if (!_.isEmpty(record)) {
                        return cb('The relationship is already created for this NAICS id and department id');
                    }

                    return cb();
                })
                .catch(cb);
        },
        (cb) => {
            async.parallel({
                NAICSType: (done) => {
                    NAICSType.findOne({ where: { id: naicsId } })
                        .then((record) => {
                            if (_.isEmpty(record)) {
                                return done(`The NAICS record with id ${naicsId} does not exist`);
                            }

                            return done(null, record);
                        })
                        .catch(done);
                },
                departmentType: (done) => {
                    DepartmentType.findOne({ where: { id: departmentId } })
                        .then((record) => {
                            if (_.isEmpty(record)) {
                                return done(`The department record with id ${departmentId} does not exist`);
                            }

                            return done(null, record);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelResult) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                return cb(null, parallelResult);
            });
        },
    ], (waterfallErr, waterFallResult) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }
        return callback(null, waterFallResult);
    });
};

const validateRelationshipUpdatePayload = (payload, callback) => {
    const {
        naicsId,
        departmentId,
    } = payload;

    if (!naicsId) {
        return callback('The naicsId is missing');
    }

    if (!departmentId) {
        return callback('The departmentId is missing');
    }

    async.waterfall([
        (cb) => {
            async.parallel({
                NAICSType: (done) => {
                    NAICSType.findOne({ where: { id: naicsId } })
                        .then((record) => {
                            if (_.isEmpty(record)) {
                                return done(`The NAICS record with id ${naicsId} does not exist`);
                            }

                            return done(null, record);
                        })
                        .catch(done);
                },
                departmentType: (done) => {
                    DepartmentType.findOne({ where: { id: departmentId } })
                        .then((record) => {
                            if (_.isEmpty(record)) {
                                return done(`The department record with id ${departmentId} does not exist`);
                            }

                            return done(null, record);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelResult) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                return cb(null, parallelResult);
            });
        },
    ], (waterfallErr, waterFallResult) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }
        return callback(null, waterFallResult);
    });
};

const validateGetAllQuery = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
    const allowedSortingColumn = [
        'id',
        'naicsId',
        'departmentId',
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

    if (query.naicsId) {
        whereCondition.naicsId = query.naicsId;
    }
    if (query.departmentId) {
        whereCondition.departmentId = query.departmentId;
    }

    return whereCondition;
};
