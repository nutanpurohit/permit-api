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
    FormAttachment,
    BuildingPermits,
    BusinessLicenseApplication,
} = db;


function create(req, res, next) {
    const { formType, formId } = req.params;

    const formTypeErr = validateAllowedFormType(formType);

    if (formTypeErr) {
        const e = new Error(formTypeErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    validateAllowedFormExist(formType, formId, (err, form) => {
        if (err) {
            const e = new Error(err);
            e.status = httpStatus.BAD_REQUEST;
            return next(e);
        }

        upload(req, res, () => {
            const payload = req.body;
            const { files } = req;

            if (_.isEmpty(files) || _.isEmpty(payload.doc_name) || _.isEmpty(payload.doc_no) || _.isEmpty(payload.doc_type)) {
                const e = new Error('Either files, doc_name, doc_no, or doc_type is missing');
                e.status = httpStatus.BAD_REQUEST;
                return next(e);
            }

            try {
                const docName = JSON.parse(payload.doc_name.replace(/\s+/g, ''));
                const docNo = JSON.parse(payload.doc_no.replace(/\s+/g, ''));
                const docType = JSON.parse(payload.doc_type.replace(/\s+/g, ''));
                const fileType = JSON.parse(payload.file_type.replace(/\s+/g, ''));

                const bulkCreatePayload = files.map((file, index) => {
                    return {
                        documentName: docName[index],
                        documentSequence: docNo[index],
                        documentType: docType[index],
                        url: `attachments/${file.filename}`,
                        applicationFormType: formType,
                        fileType: fileType[index],
                    };
                });

                FormAttachment.bulkCreate(bulkCreatePayload)
                    .then((createdRecords) => {
                        const createdRecordIds = createdRecords.map((record) => record.id);

                        const existingAttachments = _.isEmpty(form.attachments) ? [] : form.attachments;
                        const updates = { attachments: [...createdRecordIds, ...existingAttachments] };

                        const updateOption = {
                            where: {
                                id: formId,
                            },
                        };

                        if (formType === 'buildingPermit') {
                            BuildingPermits.update(updates, updateOption)
                                .then(() => {
                                    res.json({
                                        status: 'File uploaded successfully',
                                    });
                                })
                                .catch(next);
                        } else if (formType === 'businessLicense') {
                            BusinessLicenseApplication.update(updates, updateOption)
                                .then(() => {
                                    res.json({
                                        status: 'File uploaded successfully',
                                    });
                                })
                                .catch(next);
                        } else {
                            return next();
                        }
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
    const { formType, formId, attachmentId } = req.params;

    const formTypeErr = validateAllowedFormType(formType);

    if (formTypeErr) {
        const e = new Error(formTypeErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    }

    async.waterfall([
        // find the form
        (cb) => {
            validateAllowedFormExist(formType, formId, (err, form) => {
                if (err) {
                    const e = new Error(err);
                    e.status = httpStatus.BAD_REQUEST;
                    return cb(e);
                }

                const processingData = {
                    form,
                };
                return cb(null, processingData);
            });
        },
        // delete the attachment
        (processingData, cb) => {
            FormAttachment.destroy({ where: { id: attachmentId } })
                .then(() => {
                    return cb(null, processingData);
                })
                .catch(cb);
        },
        // update the attachments for the form
        (processingData, cb) => {
            const { attachments } = processingData.form;
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

            if (formType === 'buildingPermit') {
                BuildingPermits.update(updates, updateOption)
                    .then(() => {
                        cb();
                    })
                    .catch(next);
            } else if (formType === 'businessLicense') {
                BusinessLicenseApplication.update(updates, updateOption)
                    .then(() => {
                        cb();
                    })
                    .catch(next);
            } else {
                return cb();
            }
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

const validateAllowedFormExist = (formType, formId, callback) => {
    if (formType === 'buildingPermit') {
        return BuildingPermits.findOne({
            where: { id: formId },
            attributes: ['id', 'attachments'],
        })
            .then((permitForm) => {
                if (_.isEmpty(permitForm)) {
                    return callback('The building permit form do not exist');
                }
                return callback(null, permitForm);
            })
            .catch(() => {
                return callback('something went wrong while finding building permit form');
            });
    }

    if (formType === 'businessLicense') {
        return BusinessLicenseApplication.findOne({
            where: { id: formId },
            attributes: ['id', 'attachments'],
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
