import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

const {
    AnswerType,
    MoralCharacterQuestion,
    FormMoralCharacterQuestionAnswer,
    BusinessLicenseApplication,
} = db;

const allowedFormTypes = [
    'businessLicense',
];

function getAllAnswers(req, res, next) {
    const { formType, formId } = req.params;
    const formTypeErr = validateAllowedFormType(formType);

    if (formTypeErr) {
        const e = new Error(formTypeErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    const queryValidationErr = validateGetAllQuery(req.query);

    if (queryValidationErr) {
        const e = new Error(queryValidationErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    const {
        limit = 25,
        start = 0,
        sortColumn = 'createdAt',
        sortBy = 'ASC',
    } = req.query;

    const offset = start;

    async.waterfall([
        (cb) => {
            async.parallel({
                moral_answers: (done) => {
                    FormMoralCharacterQuestionAnswer.findAll({
                        where: {
                            applicationFormId: formId,
                            applicationFormType: 'businessLicense',
                        },
                        offset,
                        limit,
                        include: [
                            { model: AnswerType },
                            { model: MoralCharacterQuestion },
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
                    FormMoralCharacterQuestionAnswer.count({
                        where: {
                            applicationFormId: formId,
                            applicationFormType: 'businessLicense',
                        },
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
                    moralAnswers: parallelRes.moral_answers,
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
            moralAnswers: processingData.moralAnswers,
            total: processingData.total,
        };
        return res.json(response);
    });
}

function create(req, res, next) {
    const { formType, formId } = req.params;
    const payload = req.body;
    const formTypeErr = validateAllowedFormType(formType);

    if (formTypeErr) {
        const e = new Error(formTypeErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    async.waterfall([
        (cb) => {
            validateAllowedFormExist(formType, formId, (err) => {
                if (err) {
                    const e = new Error(err);
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }

                if (
                    _.isEmpty(payload)
                ) {
                    const e = new Error('payload cannot be empty');
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }

                return cb();
            });
        },
        (cb) => {
            const bulkCreatePayload = payload.map((payloadObj) => {
                return {
                    applicationFormId: formId,
                    applicationFormType: formType,
                    questionId: payloadObj.questionId,
                    answerId: payloadObj.answerId,
                    answerExplanation: payloadObj.answerExplanation,
                };
            });

            FormMoralCharacterQuestionAnswer.bulkCreate(bulkCreatePayload)
                .then(() => {
                    cb();
                })
                .catch(cb);
        },
    ], (waterfallErr) => {
        if (waterfallErr) {
            return next(waterfallErr);
        }
        return res.json({ status: 'Answers added successfully for this application' });
    });
}

function updateFormMoralCharacterQA(req, res, next) {
    const { formType, formId } = req.params;
    const payload = req.body;
    const formTypeErr = validateAllowedFormType(formType);

    if (formTypeErr) {
        const e = new Error(formTypeErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    async.waterfall([
        (cb) => {
            validateAllowedFormExist(formType, formId, (err) => {
                if (err) {
                    const e = new Error(err);
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }

                if (
                    _.isEmpty(payload)
                ) {
                    const e = new Error('payload cannot be empty');
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }

                return cb();
            });
        },
        (cb) => {
            async.eachSeries(payload, (payloadObj, eachCb) => {
                const updates = { ...payloadObj };
                delete updates.id;
        
                const updateOption = {
                    where: {
                        id: payloadObj.id,
                    },
                };
                FormMoralCharacterQuestionAnswer.update(updates, updateOption)
                    .then(() => {
                        eachCb();
                    })
                    .catch(() => {
                        const e = new Error('An error occurred while updating the Answer');
                        e.status = httpStatus.INTERNAL_SERVER_ERROR;
                        return next(e);
                    });
                cb();
            }, (eachErr) => {
                if (eachErr) {
                    return cb(eachErr);
                }
                return cb(null, processingData);
            });
        },
    ], (waterfallErr) => {
        if (waterfallErr) {
            return next(waterfallErr);
        }
        return res.json({ status: 'Answers updated successfully' });
    });
}

export default {
    getAllAnswers, create, updateFormMoralCharacterQA
};

const validateAllowedFormType = (formType) => {
    if (!allowedFormTypes.includes(formType)) {
        return `The attachment is not supported for form type ${formType}`;
    }

    return null;
};

const validateGetAllQuery = (query) => {
    const {
        limit, start, sortColumn, sortBy,
    } = query;
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

    if (!_.isUndefined(sortColumn) && !allowedSortingColumn.includes(sortColumn)) {
        return 'The given sorting column is not supported';
    }

    if (!_.isUndefined(sortBy) && !allowedSortBy.includes(sortBy)) {
        return 'The given sortBy value is not supported';
    }

    return null;
};

const validateAllowedFormExist = (formType, formId, callback) => {
    if (formType === 'businessLicense') {
        return BusinessLicenseApplication.findOne({
            where: { id: formId },
            attributes: ['id'],
        })
            .then((applicationForm) => {
                if (_.isEmpty(applicationForm)) {
                    return callback('The business license application form do not exist');
                }
                return callback(null, applicationForm);
            })
            .catch(() => {
                return callback('something went wrong while finding business license application');
            });
    }

    return callback();
};
