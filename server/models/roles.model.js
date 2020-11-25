import * as _ from 'lodash';

let Roles;

/**
 * UserRoles Schema
 */
module.exports = (sequelize, DataTypes) => {
    Roles = sequelize.define('Roles', {
        Id: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        Name: { type: DataTypes.TEXT },
        NormalizedName: { type: DataTypes.TEXT },
        ConcurrencyStamp: { type: DataTypes.TEXT },
    },{
        timestamps: false
    });

    Roles.sync();

    return Roles;
};
