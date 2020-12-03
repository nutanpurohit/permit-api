import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';

const { Op } = Sequelize;

const {
    DepartmentType,
    DepartmentDivision,
} = db;

function get(req, res, next) {
    const departmentId = req.params.id;
    getDepartment(departmentId, (err, response) => {
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

function getAllDepartmentAndDepartmentDivision(req, res, next) {
    async.waterfall([
        (cb) => {
            async.parallel({
                departments: (done) => {
                    DepartmentType.findAll({
                        attributes: ['id', 'name', 'shortCode'],
                        raw: true,
                    }).then((allDepartments) => {
                        done(null, allDepartments);
                    }).catch(done);
                },
                departmentDivisions: (done) => {
                    DepartmentDivision.findAll({
                        attributes: ['id', 'name', 'departmentId', 'shortCode'],
                        raw: true,
                    }).then((allDepartmentDivisions) => {
                        done(null, allDepartmentDivisions);
                    }).catch(done);
                },
            }, (err, parallelRes) => {
                if (err) {
                    return cb(err);
                }
                return cb(null, parallelRes);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }
        const allRecords = [];
        // eslint-disable-next-line array-callback-return
        processingData.departments.map((data) => {
            if (data.shortCode !== 'DRT' || data.shortCode !== 'BLB') {
                const obj = { ...data, departmentId: data.id };
                allRecords.push(obj);
            }
        });
        // eslint-disable-next-line array-callback-return
        processingData.departmentDivisions.map((data) => {
            const obj = { ...data, departmentDivisionId: data.id };
            allRecords.push(obj);
        });


        return res.json({ departments: allRecords });
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

function updateDepartment(req, res, next) {
    const payload = req.body;
    const departmentId = req.params.id;

    validateDepartmentPayload(payload, (err) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        async.waterfall([
            (cb) => {
                DepartmentType.findOne({ where: { name: payload.name } })
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
                const updates = { ...payload };
                delete updates.departmentId;
                const updateOption = {
                    where: {
                        id: departmentId,
                    },
                };

                DepartmentType.update(updates, updateOption)
                    .then(() => {
                        // eslint-disable-next-line no-shadow
                        getDepartment(departmentId, (err, response) => {
                            if (err) {
                                return next(err);
                            }
                            cb(response);
                        });
                    })
                    .catch(() => {
                        const e = new Error('An error occurred while updating the department');
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

export default {
    get, getAll, create, deleteDepartment, updateDepartment, getAllDepartmentAndDepartmentDivision,
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

const getDepartment = (departmentId, callback) => {
    async.waterfall([
        // find form details
        (cb) => {
            let departmentData = {};
            DepartmentType.findOne({
                where: { id: departmentId },
            })
                .then((result) => {
                    if (_.isEmpty(result.dataValues)) {
                        const e = new Error('The department with the given id do not exist');
                        e.status = httpStatus.NOT_FOUND;
                        return cb(e);
                    }

                    departmentData = result;
                    return cb(null, departmentData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the department details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },

    ], (waterfallErr, departmentData) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }
        delete departmentData.id;
        delete departmentData.name;
        callback(null, departmentData);
    });
};
