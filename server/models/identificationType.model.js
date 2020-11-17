import * as _ from 'lodash';

let IdentificationType;

/**
 * IdentificationType Schema
 */
module.exports = (sequelize, DataTypes) => {
    IdentificationType = sequelize.define('IdentificationType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    IdentificationType.sync();

    IdentificationType.addDefaultRecords = () => {
        IdentificationType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    IdentificationType.bulkCreate([
                        { name: 'Owner or Lessee' },
                        { name: 'Contractor' },
                        { name: 'Architect or Engineer SEAL No.' },
                        { name: 'RME' },
                    ]);
                }
            });
    };

    return IdentificationType;
};
