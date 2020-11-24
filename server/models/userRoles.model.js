import * as _ from 'lodash';

let UserRoles;

/**
 * UserRoles Schema
 */
module.exports = (sequelize, DataTypes) => {
    UserRoles = sequelize.define('UserRoles', {
        UserId: { type: DataTypes.TEXT },
        RoleId: { type: DataTypes.TEXT },
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    UserRoles.removeAttribute('id');
    UserRoles.sync();

    UserRoles.registerModels = (db) => {
        const { Roles, Users } = db;

        UserRoles.belongsTo(Roles, { foreignKey: 'RoleId' });
        UserRoles.belongsTo(Users, { foreignKey: 'UserId' });
    };

    return UserRoles;
};
