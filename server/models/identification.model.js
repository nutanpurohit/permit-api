import * as _ from 'lodash';

let Identification;

/**
 * MechanicalType Schema
 */
module.exports = (sequelize, DataTypes) => {
    Identification = sequelize.define('Identification', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        identificationTypeId: { type: DataTypes.BIGINT.UNSIGNED },
        name: { type: DataTypes.STRING(600) },
        email: { type: DataTypes.STRING(300) },
        zipCode: { type: DataTypes.STRING },
        telephone: { type: DataTypes.STRING },
        address: { type: DataTypes.STRING(600) },
    });

    Identification.sync();

    return Identification;
};
