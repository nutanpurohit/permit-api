import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

const {
    DepartmentReviewQuestion,
    AnswerType,
    DepartmentType,
    DepartmentDivision,
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
        sortColumn = 'assessmentCriteria',
        sortBy = 'ASC',
    } = req.query;

    const offset = start;

    const whereCondition = getAllWhereCondition(req.query);
    async.waterfall([
        (cb) => {
            async.parallel({
                departmentReviewQuestions: (done) => {
                    DepartmentReviewQuestion.findAll({
                        where: whereCondition,
                        offset,
                        limit,
                        order: [
                            [sortColumn, sortBy.toUpperCase()],
                        ],
                        include: [
                            { model: DepartmentType },
                            { model: DepartmentDivision },
                        ],
                    })
                        .then((types) => {
                            return done(null, types);
                        })
                        .catch(done);
                },
                total: (done) => {
                    DepartmentReviewQuestion.count({
                        where: whereCondition,
                    })
                        .then((count) => {
                            return done(null, count);
                        })
                        .catch(done);
                },
                answers: (done) => {
                    AnswerType.findAll()
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
                    departmentReviewQuestions: parallelRes.departmentReviewQuestions,
                    total: parallelRes.total,
                    answers: parallelRes.answers,
                };

                return cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }

        const response = {
            departmentReviewQuestions: processingData.departmentReviewQuestions,
            total: processingData.total,
            answers: processingData.answers,
        };
        return res.json(response);
    });
}

function create(req, res, next) {
    const payload = req.body;

    validateDepartmentReviewQuestionPayload(payload, (err) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        async.waterfall([
            (cb) => {
                payload.active = true;
                DepartmentReviewQuestion.create(payload)
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

export default {
    getAll, create,
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

    if (query.applicationFormType) {
        whereCondition.effectArea = query.applicationFormType;
    }
    if (query.departmentId) {
        whereCondition.departmentId = query.departmentId;
    } else if (query.departmentDivisionId) {
        whereCondition.departmentDivisionId = query.departmentDivisionId;
    }
    return whereCondition;
};

const validateDepartmentReviewQuestionPayload = (payload, callback) => {
    const {
        assessmentCriteria,
        effectArea,
        noImpact,
        additionalInformationOn,
        departmentId,
        departmentDivisionId,
    } = payload;

    if (_.isEmpty(assessmentCriteria)) {
        return callback('AssessmentCriteria name is missing');
    }
    if (_.isEmpty(effectArea)) {
        return callback('EffectArea is missing');
    }
    if (_.isEmpty(noImpact)) {
        return callback('NoImpact is missing');
    }
    if (_.isEmpty(additionalInformationOn)) {
        return callback('Additional information on is missing');
    }
    if (_.isEmpty(departmentId) && _.isEmpty(departmentDivisionId)) {
        return callback('Department or SubDepartment is missing');
    }
    return callback();
};
