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
    BusinessLicenseAgencyReview,
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
    questionWhereCondition.active = true;
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

function getAllDepartmentReviewAnswer(req, res, next) {
    async.waterfall([
        (cb) => {
            async.parallel({
                RPT: (done) => {
                    DepartmentDivision.findOne({
                        where: {
                            shortCode: 'RPT',
                        },
                        attributes: ['id', 'departmentId'],
                    }).then((DRTRecord) => {
                        done(null, DRTRecord);
                    }).catch(done);
                },
                DLM: (done) => {
                    DepartmentType.findOne({
                        where: {
                            shortCode: 'DLM',
                        },
                        attributes: ['id'],
                    }).then((DLMRecord) => {
                        done(null, DLMRecord);
                    }).catch(done);
                },
                COLLECTION: (done) => {
                    DepartmentDivision.findOne({
                        where: {
                            shortCode: 'COLLECTION',
                        },
                        attributes: ['id', 'departmentId'],
                    }).then((CollectionRecord) => {
                        done(null, CollectionRecord);
                    }).catch(done);
                },
                AgencyRecords: (done) => {
                    BusinessLicenseAgencyReview.findAll({
                        where: {
                            applicationFormId: req.params.applicationFormId,
                        },
                    }).then((agencyRecords) => {
                        done(null, agencyRecords);
                    }).catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                return cb(null, parallelRes);
            });
        },
        (processingData, cb) => {
            async.parallel({
                RPTReviewObj: (done) => {
                    const departmentDivisionId = _.get(processingData, 'RPT.id', null);
                    const departmentId = _.get(processingData, 'RPT.departmentId', null);
                    const RPTAnswerWhereCondition = getAllWhereCondition({
                        departmentId, departmentDivisionId,
                    }, req.params);
                    const questionWhereCondition = getQuestionWhereCondition({
                        departmentId, departmentDivisionId,
                    }, req.params);

                    getAnswerObject(RPTAnswerWhereCondition, questionWhereCondition, (err, answerData) => {
                        if (err) {
                            done(err);
                        }
                        done(null, answerData);
                    });
                },
                DLMReviewObj: (done) => {
                    const departmentId = _.get(processingData, 'DLM.id', null);
                    const DLMAnswerWhereCondition = getAllWhereCondition({
                        departmentId,
                    }, req.params);
                    const questionWhereCondition = getQuestionWhereCondition({
                        departmentId,
                    }, req.params);
                    getAnswerObject(DLMAnswerWhereCondition, questionWhereCondition, (err, answerData) => {
                        if (err) {
                            done(err);
                        }
                        done(null, answerData);
                    });
                },
                COLLECTIONReviewObj: (done) => {
                    const departmentDivisionId = _.get(processingData, 'COLLECTION.id', null);
                    const departmentId = _.get(processingData, 'COLLECTION.departmentId', null);
                    const CollectionAnswerWhereCondition = getAllWhereCondition({
                        departmentId, departmentDivisionId,
                    }, req.params);
                    const questionWhereCondition = getQuestionWhereCondition({
                        departmentId, departmentDivisionId,
                    }, req.params);
                    getAnswerObject(CollectionAnswerWhereCondition, questionWhereCondition, (err, answerData) => {
                        if (err) {
                            done(err);
                        }
                        done(null, answerData);
                    });
                },
                AGENCYReviewObj: (done) => {
                    const AgencyReviewObjList = [];
                    async.eachLimit(processingData.AgencyRecords, 5, (agencyObj, eachCB) => {
                        const departmentObj = {
                            departmentId: agencyObj.departmentId,
                            departmentDivisionId: agencyObj.departmentDivisionId,
                        };
                        const agencyAnswerWhereCondition = getAllWhereCondition(departmentObj, req.params);
                        const questionWhereCondition = getQuestionWhereCondition(departmentObj, req.params);
                        getAnswerObject(agencyAnswerWhereCondition, questionWhereCondition, (err, answerData) => {
                            if (err) {
                                eachCB(err);
                            }
                            AgencyReviewObjList.push(answerData);
                            eachCB();
                        });
                    }, (err) => {
                        if (err) {
                            done(err);
                        }
                        done(null, AgencyReviewObjList);
                    });
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                return cb(null, parallelRes);
            });
        },
    ], (parallelErr, procesingData) => {
        if (parallelErr) {
            return next(parallelErr);
        }
        const responseData = {
            RPT: procesingData.RPTReviewObj,
            DLM: procesingData.DLMReviewObj,
            COLLECTION: procesingData.COLLECTIONReviewObj,
            AGENCYReview: procesingData.AGENCYReviewObj,
        };
        res.json(responseData);
    });
}

export default {
    create, getAll, getAllDepartmentReviewAnswer,
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
    }
    if (departmentDivisionId) {
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
    }
    if (departmentDivisionId) {
        whereCondition.departmentDivisionId = departmentDivisionId;
    }
    return whereCondition;
};

const getAnswerObject = (answerWhereCondition, questionWhereCondition, cb) => {
    async.parallel({
        submittedAnswer: (subDone) => {
            DepartmentReviewAnswer.findAll({
                where: answerWhereCondition,
            })
                .then((records) => {
                    subDone(null, records);
                })
                .catch(subDone);
        },
        answers: (subDone) => {
            AnswerType.findAll({})
                .then((records) => {
                    subDone(null, records);
                })
                .catch(subDone);
        },
        questions: (subDone) => {
            DepartmentReviewQuestion.findAll({
                where: questionWhereCondition,
            })
                .then((records) => {
                    subDone(null, records);
                })
                .catch(subDone);
        },
        department: (subDone) => {
            if (!answerWhereCondition.departmentId) {
                return subDone(null, {});
            }
            DepartmentType.findOne({
                where: {
                    id: answerWhereCondition.departmentId,
                },
            }).then((departmentRecord) => {
                subDone(null, departmentRecord);
            }).catch(subDone);
        },
        departmentDivision: (subDone) => {
            if (!answerWhereCondition.departmentDivisionId) {
                return subDone(null, {});
            }
            DepartmentDivision.findOne({
                where: {
                    id: answerWhereCondition.departmentDivisionId,
                },
            }).then((departmentDivisionRecord) => {
                subDone(null, departmentDivisionRecord);
            }).catch(subDone);
        },
    }, (parallelErr, parallelRes) => {
        if (parallelErr) {
            cb(parallelErr);
        }
        const answerObject = {
            submittedAnswer: parallelRes.submittedAnswer,
            answers: parallelRes.answers,
            questions: parallelRes.questions,
            department: parallelRes.department,
            departmentDivision: parallelRes.departmentDivision,
        };

        cb(null, answerObject);
    });
};
