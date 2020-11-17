import * as _ from 'lodash';

let SewageDisposalType;
/**
 * SewageDisposalType Schema
 */
module.exports = (sequelize, DataTypes) => {
    SewageDisposalType = sequelize.define('SewageDisposalType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    SewageDisposalType.sync();

    SewageDisposalType.addDefaultRecords = () => {
        SewageDisposalType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    SewageDisposalType.bulkCreate([
                        { name: 'Public Sewer' },
                        { name: 'Private (septic tank, etc.)' },
                    ]);
                }
            });
    };

    return SewageDisposalType;
};
