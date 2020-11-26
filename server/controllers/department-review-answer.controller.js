import * as _ from 'lodash';
import httpStatus from 'http-status';
import async from 'async';
import db from '../../config/sequelize';

const {
    DepartmentReviewAnswer,
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

export default {
    create,
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
//
// answers: [],
//     submittedAnswers: [],
//     question: []
