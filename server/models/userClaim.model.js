import * as _ from 'lodash';

let UserClaims;

/**
 * UserClaim Schema
 */
module.exports = (sequelize, DataTypes) => {
    UserClaims = sequelize.define('UserClaims', {
        Id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        UserId: { type: DataTypes.TEXT },
        ClaimType: { type: DataTypes.TEXT },
        ClaimValue: { type: DataTypes.TEXT },
    }, {
        timestamps: false
    });

    UserClaims.sync();

    return UserClaims;
};
