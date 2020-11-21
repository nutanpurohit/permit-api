import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';

const { Op } = Sequelize;

const {
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
        limit = 1000,
        start = 0,
        sortColumn = 'name',
        sortBy = 'ASC',
    } = req.query;

    const offset = start;

    const whereCondition = getAllWhereCondition(req.query);
    async.waterfall([
        (cb) => {
            async.parallel({
                departmentTypes: (done) => {
                    DepartmentType.findAll({
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
                    DepartmentType.count({
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
                    departmentTypes: parallelRes.departmentTypes,
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
            departmentTypes: processingData.departmentTypes,
            total: processingData.total,
        };
        return res.json(response);
    });
}

function create(req, res, next) {
    const payload = req.body;

    validateDepartmentPayload(payload, (err) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        async.waterfall([
            (cb) => {
                DepartmentType.findOne({ where: { name: { [Op.like]: `%${payload.name}%` } } })
                    .then((duplicateRecord) => {
                        if (_.isEmpty(duplicateRecord)) {
                            return cb();
                        }

                        const e = new Error(`The department already exist for ${payload.name}`);
                        e.status = httpStatus.BAD_REQUEST;
                        return cb(e);
                    })
                    .catch(cb);
            },
            (cb) => {
                DepartmentType.create(payload)
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

function deleteDepartment(req, res, next) {
    const { id } = req.params;

    DepartmentType.destroy({ where: { id } })
        .then(() => {
            return res.json({
                status: 'Department record deleted successfully',
            });
        })
        .catch(next);
}

export default {
    getAll, create, deleteDepartment,
};

const validateGetAllQuery = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
    const allowedSortingColumn = [
        'id',
        'name',
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
    if (query.name) {
        whereCondition.name = {
            [Op.like]: `%${query.name}%`,
        };
    }

    return whereCondition;
};

const validateDepartmentPayload = (payload, callback) => {
    const {
        name,
    } = payload;

    if (_.isEmpty(name)) {
        return callback('Department name is missing');
    }

    return callback();
};
