import * as _ from 'lodash';

let NonResidential;

/**
 * NonResidential Schema
 */
module.exports = (sequelize, DataTypes) => {
    NonResidential = sequelize.define('NonResidential', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    NonResidential.sync();

    NonResidential.addDefaultRecords = () => {
        NonResidential.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    NonResidential.bulkCreate([
                        { name: 'Amusement, Recreational' },
                        { name: 'Church, other religious' },
                        { name: 'Industrial' },
                        { name: 'Parking garage' },
                        { name: 'Service station, repair garage' },
                        { name: 'Hospital, institutional' },
                        { name: 'Office, bank, professional' },
                        { name: 'Public utility' },
                        { name: 'School, library, other educational' },
                        { name: 'Stores, mercantile' },
                        { name: 'Tanks, towers' },
                    ]);
                }
            });
    };

    return NonResidential;
};
