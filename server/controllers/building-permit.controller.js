import httpStatus from 'http-status';
import db from '../../config/sequelize';

const { BuildingPermits } = db;


/**
 * Create new building permit
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function create(req, res, next) {
    // const user = User.build({
    //     username: req.body.username,
    //     type: req.body.type,
    // });
    //
    // user.save()
    //     .then((savedUser) => res.json(savedUser))
    //     .catch((e) => next(e));
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
