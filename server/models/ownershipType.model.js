import * as _ from 'lodash';

let OwnershipType;
/**
 * SewageDisposalType Schema
 */
module.exports = (sequelize, DataTypes) => {
    OwnershipType = sequelize.define('OwnershipType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    OwnershipType.sync();

    OwnershipType.addDefaultRecords = () => {
        OwnershipType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    OwnershipType.bulkCreate([
                        { name: 'Private (Individual, corporation, non-profit institution, etc.)' },
                        { name: 'Public (Federal, State, or Local Government, etc.)' },
                    ]);
                }
            });
    };

    return OwnershipType;
};
