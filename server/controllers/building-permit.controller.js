import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

const {
    BuildingType,
    IdentificationType,
    MechanicalType,
    NonResidential,
    PrincipleFameType,
    Residential,
    SewageDisposalType,
    WaterSupplyType,
} = db;

/**
 * Create new building permit
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function create(req, res, next) {
    const payload = req.body;

    // eslint-disable-next-line no-use-before-define
    validateCreatePayload((payload, validationErr) => {
        const e = new Error(validationErr);
        e.status = httpStatus.BAD_REQUEST;
        return next(e);
    });
}

/**
 * Update existing building permit
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function update(req, res, next) {
    // const { user } = req;
    // user.username = req.body.username;
    // user.mobileNumber = req.body.mobileNumber;
    //
    // user.save()
    //     .then((savedUser) => res.json(savedUser))
    //     .catch((e) => next(e));
}

/**
 * get specific building permit
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function get(req, res, callback) {
    // return res.json(req.user);
}


export default {
    get, create, update,
};

const validateCreatePayload = (payload, callback) => {
    if (!_.isEmpty(payload.buildingType)) {
        BuildingType.findAll({ where: { id: payload.buildingType } })
            .then((types) => {
                if (_.isEmpty(types) || types.length !== payload.buildingType) {
                    return callback('The building type value is incorrect');
                }
            })
            .catch(() => {
                return callback('something went wrong while checking building types');
            });
    }
};
