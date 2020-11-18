import * as _ from 'lodash';

let ApplicationStatusType;

/**
 * ApplicationStatusType Schema
 */
module.exports = (sequelize, DataTypes) => {
    ApplicationStatusType = sequelize.define('ApplicationStatusType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    ApplicationStatusType.sync();

    ApplicationStatusType.addDefaultRecords = () => {
        ApplicationStatusType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    ApplicationStatusType.bulkCreate([
                        { name: 'Received' },
                        { name: 'In Review' },
                        { name: 'Approved' },
                        { name: 'Save as Draft' },
                        { name: 'Sent' },
                    ]);
                }
            });
    };

    return ApplicationStatusType;
};
