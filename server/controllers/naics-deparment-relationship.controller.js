import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';

const { Op } = Sequelize;

const {
    NAICSType,
} = db;

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

}

export default {
    getAll, create,
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
