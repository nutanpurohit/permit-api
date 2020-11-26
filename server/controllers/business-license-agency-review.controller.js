import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

const {
    BusinessLicenseAgencyReview,
    BusinessLicenseApplication,
} = db;


function getSingle(req, res, next) {
    const { depId, formId } = req.params;

    async.waterfall([
        (cb) => {
            BusinessLicenseAgencyReview.findOne({
                where: { applicationFormId: formId, departmentId: depId },
            })
                .then((record) => {
                    const processingData = { record };
                    cb(null, processingData);
                })
                .catch(next);
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }
        const response = processingData.record || {};
        return res.json(response);
    });
}

function updateStatus(req, res, next) {
    const { depId, formId } = req.params;
    const payload = req.body;

    async.waterfall([
        (cb) => {
            const update = { reviewStatus: payload.applicationStatusId };
            const updateOption = { where: { applicationFormId: formId, departmentId: depId } };
            BusinessLicenseAgencyReview.update(update, updateOption)
                .then(() => {
                    return cb();
                })
                .catch(() => {
                    const e = new Error('Something went wrong while updating the status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
        (cb) => {
            BusinessLicenseAgencyReview.findAll(
                { where: { applicationFormId: formId } },
            )
                .then((agencyReviewRecords) => {
                    // eslint-disable-next-line eqeqeq
                    const allAgencyReviewComplete = agencyReviewRecords.every((agencyReviewRecord) => agencyReviewRecord.reviewStatus == 13);
                    if (!allAgencyReviewComplete) {
                        return cb();
                    }
                    const update = { applicationStatusId: 13 };
                    const updateOption = { where: { id: formId } };
                    BusinessLicenseApplication.update(update, updateOption)
                        .then(() => {
                            return cb();
                        })
                        .catch(() => {
                            const e = new Error('Something went wrong while updating the status of the application');
                            e.status = httpStatus.INTERNAL_SERVER_ERROR;
                            return cb(e);
                        });
                })
                .catch(() => {
                    const e = new Error('Something went wrong while updating the status');
                    e.status = httpStatus.INTERNAL_SERVER_ERROR;
                    return cb(e);
                });
        },
    ], (error) => {
        if (error) {
            return next(error);
        }

        return res.json({
            status: 'Application status updated successfully',
        });
    });
}

export default {
    getSingle, updateStatus,
};
