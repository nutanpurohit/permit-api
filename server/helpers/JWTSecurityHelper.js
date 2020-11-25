import { verify } from 'jsonwebtoken';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import axios from 'axios';
import APIError from './APIError';
import config from '../../config/config';

const jwtVerify = (req, res, next) => {
    let token = req.headers.authorization;

    if (_.isEmpty(token)) {
        const e = new APIError('Authorization token do not exist', httpStatus.UNAUTHORIZED, true);
        return next(e);
    }
    if (!token.includes('Bearer')) {
        token = `Bearer ${req.headers.authorization}`;
    }
    axios.get(config.identityServer, {
        headers: {
            Authorization: token,
        },
    })
    // eslint-disable-next-line no-shadow
        .then((res) => {
            _.set(req, 'authentication.jwt.token', token);
            _.set(req, 'authentication.jwt.payload', res.data);
            return next();
        })
        .catch(() => {
            const e = new APIError('User not authenticated', httpStatus.UNAUTHORIZED, true);
            return next(e);
        });
};

export default {
    jwtVerify,
};
