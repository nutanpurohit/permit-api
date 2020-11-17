import * as _ from 'lodash';

let WaterSupplyType;
/**
 * waterSupplyType Schema
 */
module.exports = (sequelize, DataTypes) => {
    WaterSupplyType = sequelize.define('WaterSupplyType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    WaterSupplyType.sync();

    WaterSupplyType.addDefaultRecords = () => {
        WaterSupplyType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    WaterSupplyType.bulkCreate([
                        { name: 'Public Supply' },
                        { name: 'Private (well, cistern)' },
                    ]);
                }
            });
    };

    return WaterSupplyType;
};
