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

    validateAllowedFormExist(formType, formId, (err) => {
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

                const bulkCreatePayload = files.map((file, index) => {
                    return {
                        documentName: docName[index],
                        documentSequence: docNo[index],
                        documentType: docType[index],
                        url: `attachments/${file.filename}`,
                        applicationFormType: formType,
                    };
                });

                FormAttachment.bulkCreate(bulkCreatePayload)
                    .then((createdRecords) => {
                        const createdRecordIds = createdRecords.map((record) => record.id);

                        const updates = { attachments: createdRecordIds };

                        const updateOption = {
                            where: {
                                id: formId,
                            },
                        };

                        BuildingPermits.update(updates, updateOption)
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

export default {
    create,
};

const validateAllowedFormType = (formType) => {
    if (!allowedFormTypes.includes(formType)) {
        return `The attachment is not supported for form type ${formType}`;
    }

    return null;
};

const validateAllowedFormExist = (formType, formId, callback) => {
    if (formType === 'buildingPermit') {
        return BuildingPermits.findByPk(formId)
            .then((permitForm) => {
                if (_.isEmpty(permitForm)) {
                    return callback('The building permit form do not exist');
                }
                return callback();
            })
            .catch(() => {
                return callback('something went wrong while finding building permit form');
            });
    }

    if (formType === 'businessLicense') {
        return BusinessLicenseApplication.findByPk(formId)
            .then((applicationForm) => {
                if (_.isEmpty(applicationForm)) {
                    return callback('The business license application form do not exist');
                }
                return callback();
            })
            .catch(() => {
                return callback('something went wrong while finding business license application');
            });
    }

    return callback();
};
