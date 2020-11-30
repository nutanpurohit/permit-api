import async from 'async';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import db from '../../config/sequelize';

const {
    FormSubComment, FormComment,
} = db;

function create(req, res, next) {
    const { formType } = req.params;
    const payload = req.body;

    const userId = _.get(req, 'authentication.jwt.payload.sub', null);
    payload.applicationFormType = formType;
    payload.createdBy = userId;

    async.waterfall([
        (cb) => {
            const formTypeErr = validateAllowedFormType(formType);

            if (formTypeErr) {
                const e = new Error(formTypeErr);
                e.status = httpStatus.BAD_REQUEST;
                return cb(e);
            }
            return cb(null);
        },
        (cb) => {
            const payloadErr = validatePayload(payload);
            if (payloadErr) {
                const e = new Error(payloadErr);
                e.status = httpStatus.BAD_REQUEST;
                return cb(e);
            }
            return cb(null);
        },
        (cb) => {
            valiadateParentComment(payload.parentCommentId, (commentErr) => {
                if (commentErr) {
                    const e = new Error(commentErr);
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }
                return cb(null);
            });
        },
        (cb) => {
            async.parallel({
                createdSubComment: (done) => {
                    FormSubComment.create(payload)
                        .then((createdSubComment) => {
                            done(null, createdSubComment);
                        })
                        .catch(() => {
                            const e = new Error('Something went wrong while creating the comment');
                            e.status = httpStatus.INTERNAL_SERVER_ERROR;
                            done(e);
                        });
                },
                updateSubComment: (done) => {
                    FormComment.update({ readStatus: false }, { where: { id: payload.parentCommentId } })
                        .then(() => {
                            done();
                        })
                        .catch(() => {
                            done('something went wrong while updating the parent comment status');
                        });
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                const processingData = {
                    createdSubComment: parallelRes.createdSubComment,
                };

                return cb(null, processingData);
            });
        },
    ], (error, processingData) => {
        if (error) {
            return next(error);
        }

        return res.json(processingData.createdSubComment);
    });
}

export default {
    create,
};

const validateAllowedFormType = (formType) => {
    const allowedFormTypes = ['buildingPermit', 'businessLicense'];

    if (!allowedFormTypes.includes(formType)) {
        return `The comment is not supported for form type ${formType}`;
    }

    return null;
};

const validatePayload = (payload) => {
    const {
        text,
        parentCommentId,
    } = payload;

    if (_.isEmpty(text)) {
        return 'The comment text should not be empty';
    }
    if (_.isUndefined(parentCommentId)) {
        return 'The parent comment id should not be empty';
    }
    return null;
};

const valiadateParentComment = (commentId, cb) => {
    FormComment.findOne({
        where: {
            id: commentId,
        },
    }).then((comment) => {
        if (_.isEmpty(comment)) {
            return cb('The comment not exist');
        }
        return cb();
    }).catch(() => {
        return cb('Something went wrong while finding the comment details');
    });
};
