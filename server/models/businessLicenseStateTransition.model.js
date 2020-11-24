import * as _ from 'lodash';

/**
 * BusinessLicenseStateTransition Schema
 */
module.exports = (sequelize, DataTypes) => {
    const BusinessLicenseStateTransition = sequelize.define('BusinessLicenseStateTransition', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        applicationFormId: { type: DataTypes.BIGINT.UNSIGNED },
        fromState: { type: DataTypes.BIGINT.UNSIGNED },
        toState: { type: DataTypes.BIGINT.UNSIGNED },
        stateChangeDate: { type: DataTypes.DATE },
    });

    BusinessLicenseStateTransition.sync();

    return BusinessLicenseStateTransition;
};
