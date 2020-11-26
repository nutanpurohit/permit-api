import * as _ from 'lodash';
import httpStatus from 'http-status';
import async from 'async';
import db from '../../config/sequelize';

const {
    DepartmentReviewAnswer,
    DepartmentType,
    DepartmentDivision,
    AnswerType,
    DepartmentReviewQuestion,
} = db;

function create(req, res, next) {
    const payload = req.body;
    validateDepartmentReviewQuestionPayload(payload, (err) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        return async.eachLimit(payload, 5, (answerObj, eachCb) => {
            if (!answerObj.id) {
                // create
                DepartmentReviewAnswer.create(answerObj)
                    .then(() => {
                        return eachCb();
                    })
                    .catch(() => {
                        return eachCb('something went wrong while creating the departReviewAnswer');
                    });
            } else {
                // update
                const updatePayload = { ...answerObj };
                delete updatePayload.id;
                DepartmentReviewAnswer.update(updatePayload, { where: { id: answerObj.id } })
                    .then(() => {
                        return eachCb();
                    })
                    .catch(() => {
                        return eachCb('something went wrong while updating the departmentReviewAnswer');
                    });
            }
        }, (eachErr) => {
            if (eachErr) {
                return next(eachErr);
            }
            return res.json({ status: 'Answers submitted successfully' });
        });
    });
}

function getAll(req, res, next) {
    const queryValidationErr = validateGetAllQuery(req.query, req.params);
    if (queryValidationErr) {
        const e = new Error(queryValidationErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }
    const whereCondition = getAllWhereCondition(req.query, req.params);
    const questionWhereCondition = getQuestionWhereCondition(req.query, req.params);
    async.waterfall([
        (cb) => {
            async.parallel({
                submittedAnswer: (done) => {
                    DepartmentReviewAnswer.findAll({
                        where: whereCondition,
                        include: [
                            { model: DepartmentDivision },
                            { model: DepartmentType },
                        ],
                    })
                        .then((records) => {
                            done(null, records);
                        })
                        .catch(done);
                },
                total: (done) => {
                    DepartmentReviewAnswer.count({
                        where: whereCondition,
                    })
                        .then((count) => {
                            return done(null, count);
                        })
                        .catch(done);
                },
                answers: (done) => {
                    AnswerType.findAll({})
                        .then((records) => {
                            done(null, records);
                        })
                        .catch(done);
                },
                questions: (done) => {
                    DepartmentReviewQuestion.findAll({
                        where: questionWhereCondition,
                        include: [
                            { model: DepartmentDivision },
                            { model: DepartmentType },
                        ],
                    })
                        .then((records) => {
                            done(null, records);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                const processingData = {
                    submittedAnswer: parallelRes.submittedAnswer,
                    total: parallelRes.total,
                    answers: parallelRes.answers,
                    questions: parallelRes.questions,
                };

                return cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }

        const response = {
            submittedAnswer: processingData.submittedAnswer,
            total: processingData.total,
            answers: processingData.answers,
            questions: processingData.questions,
        };
        return res.json(response);
    });
}

export default {
    create, getAll,
};

const validateDepartmentReviewQuestionPayload = (payload, callback) => {
    // eslint-disable-next-line array-callback-return
    payload.forEach((data, i) => {
        const {
            departmentReviewQuestionId,
            applicationFormId,
            applicationFormType,
            answerId,
            departmentId,
            departmentDivisionId,
        } = data;
        if (_.isEmpty(departmentReviewQuestionId)) {
            return callback(`DepartmentReviewQuestionId is missing on ${i + 1} position's record`);
        }
        if (_.isEmpty(applicationFormId)) {
            return callback(`ApplicationForm is missing on ${i + 1} position's record`);
        }
        if (_.isEmpty(applicationFormType)) {
            return callback(`ApplicationFormType is missing on ${i + 1} position's record`);
        }
        if (_.isEmpty(answerId)) {
            return callback(`Answer is missing on ${i + 1} position's record`);
        }
        if (_.isEmpty(departmentId) && _.isEmpty(departmentDivisionId)) {
            return callback(`Department or SubDepartment is missing on ${i + 1} position's record`);
        }
    });


    return callback();
};

const validateGetAllQuery = (query, param) => {
    const {
        departmentId, departmentDivisionId,
    } = query;
    const {
        applicationFormType, applicationFormId,
    } = param;

    if (_.isUndefined(applicationFormType)) {
        return 'applicationFormType is missing';
    }

    if (_.isUndefined(applicationFormId)) {
        return 'applicationFormId is missing';
    }

    if (!_.isUndefined(applicationFormId) && isNaN(applicationFormId)) {
        return 'applicationFormId should be number value';
    }

    if (_.isUndefined(departmentId) && _.isUndefined(departmentDivisionId)) {
        return 'departmentId and departmentDivisionId both are missing';
    }

    if (!_.isUndefined(departmentId) && isNaN(departmentId)) {
        return 'departmentId should be number value';
    }

    if (!_.isUndefined(departmentDivisionId) && isNaN(departmentDivisionId)) {
        return 'departmentDivisionId should be number value';
    }

    return null;
};

const getAllWhereCondition = (query, param) => {
    const {
        departmentId, departmentDivisionId,
    } = query;
    const {
        applicationFormType, applicationFormId,
    } = param;
    const whereCondition = {};

    if (applicationFormType) {
        whereCondition.applicationFormType = applicationFormType;
    }
    if (applicationFormId) {
        whereCondition.applicationFormId = applicationFormId;
    }
    if (departmentId) {
        whereCondition.departmentId = departmentId;
    } else if (departmentDivisionId) {
        whereCondition.departmentDivisionId = departmentDivisionId;
    }
    return whereCondition;
};

const getQuestionWhereCondition = (query, param) => {
    const {
        departmentId, departmentDivisionId,
    } = query;
    const {
        applicationFormType,
    } = param;
    const whereCondition = {};

    if (applicationFormType) {
        whereCondition.effectArea = applicationFormType;
    }
    if (departmentId) {
        whereCondition.departmentId = departmentId;
    } else if (departmentDivisionId) {
        whereCondition.departmentDivisionId = departmentDivisionId;
    }
    return whereCondition;
};
