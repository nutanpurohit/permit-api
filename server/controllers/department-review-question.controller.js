import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

const {
    DepartmentReviewQuestion,
    AnswerType,
    DepartmentType,
    DepartmentDivision,
    FormComment,
} = db;

function getAll(req, res, next) {
    const whereCondition = getAllWhereCondition(req.query);
    whereCondition.active = true;
    const commentCondition = getCommentWhereCondition(req.query);
    const {
        limit = 200,
        start = 0,
        sortColumn = 'id',
        sortBy = 'ASC',
    } = req.query;
    const offset = start;
    async.waterfall([
        (cb) => {
            async.parallel({
                departmentReviewQuestions: (done) => {
                    DepartmentReviewQuestion.findAll({
                        where: whereCondition,
                        offset,
                        limit,
                        include: [
                            { model: DepartmentType },
                            { model: DepartmentDivision },
                        ],
                        order: [
                            [sortColumn, sortBy.toUpperCase()],
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
                additionalInformation: (done) => {
                    FormComment.findAll({
                        where: commentCondition,
                    }).then((record) => {
                        done(null, record);
                    }).catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                const processingData = {
                    departmentReviewQuestions: parallelRes.departmentReviewQuestions,
                    total: parallelRes.total,
                    answers: parallelRes.answers,
                    additionalInformation: parallelRes.additionalInformation,
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
            additionalInformation: processingData.additionalInformation,
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

function update(req, res, next) {
    const payload = req.body;
    const departmentQuestionId = req.params.id;

    async.waterfall([
        (cb) => {
            DepartmentReviewQuestion.findOne({ where: { id: departmentQuestionId } }).then((record) => {
                if (_.isEmpty(record)) {
                    const e = new Error('The department with the given id do not exist');
                    e.status = httpStatus.NOT_FOUND;
                    return cb(e);
                }
                cb();
            });
        },
        (cb) => {
            const updates = { ...payload };
            delete updates.departmentQuestionId;

            const updateOption = {
                where: {
                    id: departmentQuestionId,
                },
            };

            DepartmentReviewQuestion.update(updates, updateOption)
                .then(() => {
                    // eslint-disable-next-line no-shadow
                    getDepartmentReviewQuestion(departmentQuestionId, (err, response) => {
                        if (err) {
                            return next(err);
                        }
                        return cb(null, response);
                    });
                })
                .catch(() => {
                    const e = new Error('An error occurred while updating the departmentReviewQuestion');
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

function deleteDapartmentReviewQuestion(req, res, next) {
    const { id } = req.params;

    DepartmentReviewQuestion.destroy({ where: { id } })
        .then(() => {
            return res.json({
                status: 'DepartmentReviewQuestion record deleted successfully',
            });
        })
        .catch(next);
}

export default {
    getAll, create, update, deleteDapartmentReviewQuestion,
};

const getAllWhereCondition = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
    const whereCondition = {};
    const allowedSortingColumn = [
        'id',
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

    if (query.applicationFormType) {
        whereCondition.effectArea = query.applicationFormType;
    }
    if (query.departmentId) {
        whereCondition.departmentId = query.departmentId;
    }
    if (query.departmentDivisionId) {
        whereCondition.departmentDivisionId = query.departmentDivisionId;
    }
    if (!_.isUndefined(sortColumn) && !allowedSortingColumn.includes(sortColumn)) {
        return 'The given sorting column is not supported';
    }

    if (!_.isUndefined(sortBy) && !allowedSortBy.includes(sortBy)) {
        return 'The given sortBy value is not supported';
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

const getDepartmentReviewQuestion = (departmentId, callback) => {
    async.waterfall([
        // find departmentReviewQuestion details
        (cb) => {
            let departmentReviewQuestionData = {};
            DepartmentReviewQuestion.findOne({
                where: { id: departmentId },
            })
                .then((result) => {
                    if (_.isEmpty(result.dataValues)) {
                        const e = new Error('The department with the given id do not exist');
                        e.status = httpStatus.NOT_FOUND;
                        cb(e);
                    }

                    departmentReviewQuestionData = result;
                    cb(null, departmentReviewQuestionData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the department details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    cb(e);
                });
        },

    ], (waterfallErr, departmentReviewQuestionData) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }
        delete departmentReviewQuestionData.id;
        return callback(null, departmentReviewQuestionData);
    });
};


const getCommentWhereCondition = (query) => {
    const {
        departmentId, departmentDivisionId,
    } = query;
    const whereCondition = {};
    if (departmentId) {
        whereCondition.departmentId = departmentId;
    }
    if (departmentDivisionId) {
        whereCondition.departmentDivisionId = departmentDivisionId;
    }
    return whereCondition;
};
