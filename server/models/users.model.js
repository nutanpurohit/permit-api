import * as _ from 'lodash';

let Users;

/**
 * UserClaim Schema
 */
module.exports = (sequelize, DataTypes) => {
    Users = sequelize.define('Users', {
        Id: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        UserName: { 
            type: DataTypes.CHAR,
            unique: 'compositeIndex'
        },
        NormalizedUserName: {type: DataTypes.CHAR }, 
        Email: { 
            type: DataTypes.CHAR,
            unique: 'compositeIndex'
        },
        NormalizedEmail:{type:DataTypes.CHAR},
        EmailConfirmed:{ type: DataTypes.BOOLEAN},
        PasswordHash: {type: DataTypes.TEXT},
        SecurityStamp: {type: DataTypes.TEXT},
        ConcurrencyStamp: {type: DataTypes.TEXT},
        PhoneNumberConfirmed: {type: DataTypes.BOOLEAN},
        TwoFactorEnabled: {type: DataTypes.BOOLEAN},
        LockoutEnd: {type: DataTypes.DATE},
        LockoutEnabled: {type: DataTypes.BOOLEAN},
        AccessFailedCount: {type: DataTypes.INTEGER},
        FirstName: {type: DataTypes.TEXT},
        LastName: {type: DataTypes.TEXT},
        EmailId: {type: DataTypes.TEXT},
        Password: {type: DataTypes.TEXT},
        Address: {type: DataTypes.TEXT},
        PhoneNumber: {type: DataTypes.TEXT},
        IsActive: {type: DataTypes.BOOLEAN},
        IsDelete: {type: DataTypes.BOOLEAN},
        CreatedBy: {type: DataTypes.UUID},
        ModifiedBy:{type: DataTypes.UUID},
        CreatedDate: {type: DataTypes.DATE},
        ModifiedDate: {type: DataTypes.DATE},
    }, {
        timestamps: false
    });

    Users.sync();

    return Users;
};
