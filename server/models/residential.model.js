import * as _ from 'lodash';

/**
 * Residential Schema
 */
module.exports = (sequelize, DataTypes) => {
    const Residential = sequelize.define('Residential', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    Residential.sync();

    Residential.addDefaultRecords = () => {
        Residential.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    Residential.bulkCreate([
                        { name: 'One family' },
                        { name: 'Two or more families' },
                        { name: 'Transient hotel, motel, or dormitory' },
                        { name: 'Garage' },
                        { name: 'Carport' },
                        { name: 'Other (specify)' },
                    ]);
                }
            });
    };

    return Residential;
};
