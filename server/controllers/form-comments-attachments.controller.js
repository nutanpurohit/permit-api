import async from 'async';
import httpStatus from 'http-status';
import multer from 'multer';
import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import db from '../../config/sequelize';

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const dest = './server/public/attachments/';
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        cb(null, dest);
    },
    filename(req, file, cb) {
        cb(null, uuidv4() + path.extname(file.originalname));
    },
});
const upload = multer({ storage }).any();
const allowedFormTypes = [
    'buildingPermit',
    'businessLicense',
];

const {
    FormCommentAttachment,
    FormComment
} = db;


function create(req, res, next) {
    const { formType, commentId } = req.params;

    const formTypeErr = validateAllowedFormType(formType);

    if (formTypeErr) {
        const e = new Error(formTypeErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    validateCommentExist(commentId, (err, comment) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        upload(req, res, () => {
            const payload = req.body;
            const { files } = req;

            if (_.isEmpty(files) || _.isEmpty(payload.doc_name)) {
                const e = new Error('Either files, doc_name is missing');
                e.status = httpStatus.BAD_REQUEST;
                return next(e);
            }

            try {
                const docName = JSON.parse(payload.doc_name.replace(/\s+/g, ''));
                const fileType = JSON.parse(payload.file_type.replace(/\s+/g, ''));

                const bulkCreatePayload = files.map((file, index) => {
                    return {
                        documentName: docName[index],
                        url: `attachments/${file.filename}`,
                        fileType: fileType[index],
                    };
                });

                FormCommentAttachment.bulkCreate(bulkCreatePayload)
                    .then((createdRecords) => {
                        const createdRecordIds = createdRecords.map((record) => record.id);

                        const existingAttachments = _.isEmpty(comment.attachments) ? [] : comment.attachments;
                        const updates = { attachments: [...createdRecordIds, ...existingAttachments] };

                        const updateOption = {
                            where: {
                                id: commentId,
                            },
                        };

                        FormComment.update(updates, updateOption)
                        .then(() => {
                            res.json({
                                status: 'File uploaded successfully',
                            });
                        })
                        .catch(next);
                    })
                    .catch(next);
                // eslint-disable-next-line no-shadow
            } catch (err) {
                const e = new Error('The form data is not a valid json array');
                e.status = httpStatus.BAD_REQUEST;
                return next(e);
            }
        });
    });
}

function deleteAttachment(req, res, next) {
    const { attachmentId, commentId } = req.params;
    async.waterfall([
        // find the comment
        (cb) => {
            validateCommentExist(commentId, (err, comment) => {
                if (err) {
                    const e = new Error(err);
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }

                const processingData = {
                    comment,
                };
                return cb(null, processingData);
            });
        },
        // delete the attachment
        (processingData, cb) => {
            FormCommentAttachment.destroy({ where: { id: attachmentId } })
                .then(() => {
                    return cb(null, processingData);
                })
                .catch(cb);
        },
        // update the attachments for the comment
        (processingData, cb) => {
            const { attachments } = processingData.comment;
            const index = attachments.indexOf(attachmentId);
            if (index !== -1) {
                attachments.splice(index, 1);
            }

            const updates = { attachments };

            const updateOption = {
                where: {
                    id: formId,
                },
            };

            FormComment.update(updates, updateOption)
                    .then(() => {
                        cb();
                    })
                    .catch(next);
        },
    ], (err) => {
        if (err) {
            return next(err);
        }
        return res.json({
            status: 'File removed successfully',
        });
    });
}

export default {
    create, deleteAttachment,
};

const validateAllowedFormType = (formType) => {
    if (!allowedFormTypes.includes(formType)) {
        return `The attachment is not supported for form type ${formType}`;
    }

    return null;
};

const validateCommentExist = (commentId, callback) => {
    return FormComment.findOne({
        where: { id: commentId }
    })
        .then((comment) => {
            if (_.isEmpty(comment)) {
                return callback('The comment do not exist');
            }
            return callback(null, comment);
        })
        .catch(() => {
            return callback('something went wrong while finding comment');
        });
};