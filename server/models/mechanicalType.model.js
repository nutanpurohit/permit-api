import * as _ from 'lodash';

let MechanicalType;

/**
 * MechanicalType Schema
 */
module.exports = (sequelize, DataTypes) => {
    MechanicalType = sequelize.define('MechanicalType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    MechanicalType.sync();

    MechanicalType.addDefaultRecords = () => {
        MechanicalType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    MechanicalType.bulkCreate([
                        { name: 'Central Air Conditioning' },
                        { name: 'Will there be an elevator?' },
                    ]);
                }
            });
    };

    return MechanicalType;
};
