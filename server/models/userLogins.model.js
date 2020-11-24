import * as _ from 'lodash';

let UserLogins;

/**
 * UserLogin Schema
 */
module.exports = (sequelize, DataTypes) => {
    UserLogins = sequelize.define('UserLogins', {
        LoginProvider:{ type: DataTypes.TEXT},
        ProviderKey:{ type: DataTypes.TEXT},
        ProviderDisplayName:{ type: DataTypes.TEXT},
        UserId: { type: DataTypes.TEXT },
    });

    UserLogins.sync();

    return UserLogins;
};
