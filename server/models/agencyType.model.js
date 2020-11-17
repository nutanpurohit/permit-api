import * as _ from 'lodash';

/**
 * AgencyType Schema
 */
module.exports = (sequelize, DataTypes) => {
    const AgencyType = sequelize.define('AgencyType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    AgencyType.sync();

    AgencyType.addDefaultRecords = () => {
        AgencyType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    AgencyType.bulkCreate([
                        { name: 'Land Management, Zone' },
                        { name: 'Contractor\'s license Board' },
                        { name: 'Public Heath' },
                        { name: 'E.P.A' },
                        { name: 'GWA' },
                        { name: 'Guam Power Authority' },
                        { name: 'Fire Prevention Bureau' },
                        { name: 'Peals Board' },
                        { name: 'Parks & Rec.' },
                    ]);
                }
            });
    };

    return AgencyType;
};
