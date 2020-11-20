import { verify } from 'jsonwebtoken';
// import httpStatus from 'http-status';
// import * as _ from 'lodash';
// import APIError from './APIError';
import config from '../../config/config';

const jwtVerify = (req, res, next) => {
    const token = req.headers.authorization;

    verify(token, config.jwtSecret, (err, decoded) => {
        // if (err) {
        //     const e = new APIError('User not authenticated', httpStatus.UNAUTHORIZED, true);
        //     return next(e);
        // }
        // _.set(req, 'authentication.jwt.token', token);
        // _.set(req, 'authentication.jwt.payload', decoded);
        return next();
    });
};

export default {
    jwtVerify,
};
