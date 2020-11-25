import async from 'async';
import httpStatus from 'http-status';
import db from '../../config/sequelize';

const {
    Users,
    UserClaims,
    UserRoles,
    Roles,
} = db;

function getAll(req, res, next) {
    const whereCondition = getAllWhereCondition(req.query);
    async.waterfall([
        (cb) => {
            async.parallel({
                UsersRecord: (done) => {
                    Users.findOne({
                        where: whereCondition,
                        attributes: ['Id', 'UserName','Email','PhoneNumber'],
                        raw: true,
                    })
                        .then((record) => {
                            if (!record) {
                                const e = new Error('The user with the given username do not exist');
                                e.status = httpStatus.BAD_REQUEST;
                                return done(e);
                            }
                            return done(null, record);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                const processingData = {
                    userRecord: parallelRes.UsersRecord,
                };

                cb(null, processingData);
            });
        },
        (processingData, cb) => {
            const whereConditionObj = {
                UserId: processingData.userRecord.Id,
            };
            async.parallel({
                userClaimData: (done) => {
                    UserClaims.findOne({
                        where: whereConditionObj,
                    })
                        .then((record) => {
                            return done(null, record);
                        })
                        .catch(done);
                },
                userRoleData: (done) => {
                    UserRoles.findOne({
                        where: whereConditionObj,
                        include: [
                            { model: Roles },
                        ],
                    })
                        .then((record) => {
                            return done(null, record);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }

                processingData.userRecord.userClaim = parallelRes.userClaimData;
                processingData.userRecord.userRole = parallelRes.userRoleData.Role.Name;
                cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }

        return res.json(processingData.userRecord);
    });
}

export default {
    getAll,
};

const getAllWhereCondition = (query) => {
    const whereCondition = {};

    if (query.UserName) {
        whereCondition.UserName = query.UserName;
    }

    return whereCondition;
};
