/**
 * Building Type Schema
 */
import * as _ from 'lodash';

let BuildingType;

module.exports = (sequelize, DataTypes) => {
    BuildingType = sequelize.define('BuildingType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    BuildingType.sync();

    BuildingType.addDefaultRecords = () => {
        BuildingType.findAll()
            .then((buildingTypes) => {
                if (_.isEmpty(buildingTypes)) {
                    BuildingType.bulkCreate([
                        { name: 'New Building' },
                        { name: 'Foundation Only' },
                        { name: 'Shell Only' },
                        { name: 'Fence Wall' },
                        { name: 'Retaining Wall' },
                        { name: 'Other' },
                        { name: 'Add' },
                        { name: 'Alter' },
                        { name: 'Repair' },
                        { name: 'Demolished' },
                        { name: 'Reconstructed' },
                        { name: 'Relocated' },
                    ]);
                }
            });
    };

    return BuildingType;
};
