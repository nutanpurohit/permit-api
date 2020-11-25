let UserTokens;

/**
 * UserClaim Schema
 */
module.exports = (sequelize, DataTypes) => {
    UserTokens = sequelize.define('UserTokens', {
        UserId: { type: DataTypes.TEXT },
        LoginProvider: { type: DataTypes.TEXT },
        Name: { type: DataTypes.TEXT },
        Value: { type: DataTypes.TEXT },
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    UserTokens.removeAttribute('id');
    UserTokens.sync();

    UserTokens.registerModels = (db) => {
        const { Users } = db;

        UserTokens.belongsTo(Users, { foreignKey: 'UserId' });
    };

    return UserTokens;
};
