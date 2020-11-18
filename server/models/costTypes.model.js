import * as _ from 'lodash';

let CostType;

/**
 * ApplicationStatusType Schema
 */
module.exports = (sequelize, DataTypes) => {
    CostType = sequelize.define('CostType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    CostType.sync();

    CostType.addDefaultRecords = () => {
        CostType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    CostType.bulkCreate([
                        { name: 'Cost of Improvements' },
                        { name: 'electrical' },
                        { name: 'plumbing' },
                        { name: 'heating, air conditioning' },
                    ]);
                }
            });
    };

    return CostType;
};
