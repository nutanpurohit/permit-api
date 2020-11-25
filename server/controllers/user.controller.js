import async from 'async';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import db from '../../config/sequelize';

const {
    Users,
    UserClaims,
    UserRoles,
    Roles,
    DepartmentType,
    DepartmentDivision,
} = db;

function getAll(req, res, next) {
    const whereCondition = getAllWhereCondition(req.query);
    async.waterfall([
        (cb) => {
            async.parallel({
                UsersRecord: (done) => {
                    Users.findOne({
                        where: whereCondition,
                        attributes: ['Id', 'UserName', 'Email', 'PhoneNumber'],
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
                let userRole;
                if (parallelRes.userRoleData) {
                    userRole = parallelRes.userRoleData.Role.Name;
                } else {
                    userRole = null;
                }
                processingData.userRecord.userClaim = parallelRes.userClaimData;
                processingData.userRecord.userRole = userRole;
                cb(null, processingData);
            });
        },
        (processingData, cb) => {
            const userClaimType = _.get(processingData, 'userRecord.userClaim.ClaimType', null);
            const userClaimValue = _.get(processingData, 'userRecord.userClaim.ClaimValue', null);
            const claimWhere = {
                claim: userClaimValue,
            };
            if (userClaimType === 'department') {
                async.parallel({
                    userDepartment: (done) => {
                        DepartmentType.findOne({
                            where: claimWhere,
                            raw:true,
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
                    processingData.userRecord.department = parallelRes.userDepartment;
                    cb(null, processingData);
                });
            } else if (userClaimType === 'reviewer') {
                async.parallel({
                    userDepartment: (done) => {
                        DepartmentDivision.findOne({
                            where: claimWhere,
                            raw:true,
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
                    processingData.userRecord.department = parallelRes.userDepartment;
                    cb(null, processingData);
                });
            }
        },
        (processingData,cb)=>{
            const departmentId = _.get(processingData, 'userRecord.department.departmentId', null);
             const departData= _.get(processingData, 'userRecord.department', null);
            if(departmentId){
                async.parallel({
                    mainDepartment: (done) => {
                        DepartmentType.findOne({
                            where: {
                                id:departmentId
                            },
                            raw:true,
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
                    processingData.userRecord.department = {
                        ...parallelRes.mainDepartment,
                        subDepartment:{
                            ...departData
                        }
                    }
                    cb(null, processingData);
                });
            }
            else{
                cb(null,processingData);
            }
            
        }
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
