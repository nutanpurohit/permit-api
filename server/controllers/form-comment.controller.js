import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

const {
    FormComment,
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

    FormComment.findAll({
        where: { formId, applicationFormType: formType },
        offset,
        limit,
        order: [
            [sortColumn, sortBy.toUpperCase()],
        ],
    })
        .then((comments) => {
            return res.json(comments);
        })
        .catch(next);
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

export default {
    getAll, create,
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
