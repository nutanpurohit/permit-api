import async from 'async';
import httpStatus from 'http-status';
import db from '../../config/sequelize';

const {
    ClearanceType,
    OrganizationType,
} = db;


/**
 * Returns all the options
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function getAll(req, res, next) {
    async.parallel({
        clearanceType: (cb) => {
            ClearanceType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        organizationType: (cb) => {
            OrganizationType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
    }, (err, parallelResult) => {
        if (err) {
            const e = new Error('An error occurred while finding the business license application options');
            e.status = httpStatus.INTERNAL_SERVER_ERROR;
            return next(e);
        }

        return res.json(parallelResult);
    });
}


export default {
    getAll,
};
