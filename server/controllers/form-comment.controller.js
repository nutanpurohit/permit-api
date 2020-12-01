import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

const {
    FormComment,
    FormCommentAttachment,
    FormSubComment,
    Users,
} = db;


function getAll(req, res, next) {
    const { formId, formType } = req.params;
    const queryValidationErr = validateGetAllQuery(req.query);
    const formTypeErr = validateAllowedFormType(formType);

    if (queryValidationErr || formTypeErr) {
        const e = new Error(queryValidationErr || formTypeErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    const {
        limit = 10,
        start = 0,
        sortColumn = 'id',
        sortBy = 'DESC',
    } = req.query;

    const offset = start;

    async.waterfall([
        (cb) => {
            const processingData = {
            };
            FormComment.findAll({
                where: { formId, applicationFormType: formType },
                offset,
                limit,
                order: [
                    [sortColumn, sortBy.toUpperCase()],
                ],
            })
                .then((comments) => {
                    processingData.comments = comments;
                    cb(null, processingData);
                })
                .catch(next);
        },
        (processingData, cb) => {
            processingData.completeData = [];

            async.eachSeries(processingData.comments, (applicationObj, eachCb) => {
                getSingleComment(applicationObj.id, (err, response) => {
                    if (err) {
                        return eachCb(err);
                    }
                    processingData.completeData.push(response);
                    eachCb();
                });
            }, (eachErr) => {
                if (eachErr) {
                    return cb(eachErr);
                }
                return cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }
        const response = processingData.completeData;
        return res.json(response);
    });
}

function create(req, res, next) {
    const { formId, formType } = req.params;
    const formTypeErr = validateAllowedFormType(formType);

    if (formTypeErr) {
        const e = new Error(formTypeErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    const payload = req.body;
    payload.formId = formId;
    payload.applicationFormType = formType;
    payload.readStatus = false;

    async.waterfall([
        (cb) => {
            FormComment.create(payload)
                .then((createdComment) => {
                    const processingData = {
                        createdComment,
                    };
                    return cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while creating the comment');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
    ], (error, processingData) => {
        if (error) {
            return next(error);
        }

        return res.json(processingData.createdComment);
    });
}

function updateStatus(req, res, next) {
    const {
        id,
    } = req.params;

    const {
        formType, formId,
    } = req.body;

    async.waterfall([
        (cb) => {
            validateCommentId(id, (commentErr) => {
                if (commentErr) {
                    const e = new Error(commentErr);
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }
                return cb(null);
            });
        },
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
            FormComment.update({
                readStatus: true,
            }, {
                where: {
                    id,
                    formId,
                    applicationFormType: formType,
                },
            }).then(() => {
                return cb(null, 'Comment read status updated');
            }).catch((error) => {
                const e = new Error(error);
                e.status = httpStatus.INTERNAL_SERVER_ERROR;
                return cb(e);
            });
        },
    ], (waterfallErr, processingData) => {
        if (waterfallErr) {
            return next(waterfallErr);
        }

        return res.json(processingData);
    });
}

export default {
    getAll, create, updateStatus,
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

const validateAllowedFormType = (formType) => {
    const allowedFormTypes = ['buildingPermit', 'businessLicense'];

    if (!allowedFormTypes.includes(formType)) {
        return `The comment is not supported for form type ${formType}`;
    }

    return null;
};

const getSingleComment = (commentId, callback) => {
    async.waterfall([
        // find form details
        (cb) => {
            const processingData = {};
            FormComment.findOne({
                where: { id: commentId },
                include: [
                    {
                        model: FormSubComment,
                        include: [{ model: Users }],
                        order: [
                            ['id', 'ASC'],
                        ],
                    },
                    { model: Users },
                ],
            })
                .then((comment) => {
                    if (_.isEmpty(comment)) {
                        const e = new Error('The comment not exist');
                        e.status = httpStatus.NOT_FOUND;
                        return cb(e);
                    }
                    processingData.commentForm = JSON.parse(JSON.stringify(comment));
                    cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding the comment details');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        // find the application attachments
        (processingData, cb) => {
            const { attachments } = processingData.commentForm;
            if (_.isEmpty(attachments)) {
                return cb(null, processingData);
            }
            FormCommentAttachment.findAll({
                where: { id: attachments },
            })
                .then((attachmentRecords) => {
                    processingData.commentForm.attachments = attachmentRecords;
                    cb(null, processingData);
                })
                .catch(() => {
                    const e = new Error('Something went wrong while finding comment attachments');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
    ], (waterfallErr, processingData) => {
        if (waterfallErr) {
            return callback(waterfallErr);
        }

        return callback(null, processingData.commentForm);
    });
};

const validateCommentId = (id, cb) => {
    FormComment.findOne({
        where: {
            id,
        },
    }).then((commentData) => {
        if (_.isEmpty(commentData)) {
            return cb('Comment not found');
        }
        return cb(null);
    });
};
