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
        applicationFormType: { type: DataTypes.STRING },
    });

    ApplicationStatusType.sync();

    ApplicationStatusType.addDefaultRecords = () => {
        ApplicationStatusType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    ApplicationStatusType.bulkCreate([
                        { name: 'Draft', applicationFormType: 'businessLicense' },
                        { name: 'Submitted', applicationFormType: 'businessLicense' },
                        { name: 'DRT BLB Received', applicationFormType: 'businessLicense' },
                        { name: 'DRT BLB Request Correction', applicationFormType: 'businessLicense' },
                        { name: 'DRT RPT Review', applicationFormType: 'businessLicense' },
                        { name: 'DRT RPT Review In-progress', applicationFormType: 'businessLicense' },
                        { name: 'DRT RPT Review Complete', applicationFormType: 'businessLicense' },
                        { name: 'DLM Review', applicationFormType: 'businessLicense' },
                        { name: 'DLM Review In-progress', applicationFormType: 'businessLicense' },
                        { name: 'DLM Review Complete', applicationFormType: 'businessLicense' },
                        { name: 'Agency Review', applicationFormType: 'businessLicense' },
                        { name: 'Agency Review In-progress', applicationFormType: 'businessLicense' },
                        { name: 'Agency Review Complete', applicationFormType: 'businessLicense' },
                        { name: 'DRT Collections Review', applicationFormType: 'businessLicense' },
                        { name: 'DRT Collections Review In-progress', applicationFormType: 'businessLicense' },
                        { name: 'DRT Collections Review Complete', applicationFormType: 'businessLicense' },
                        { name: 'Cancelled', applicationFormType: 'businessLicense' },
                        { name: 'Disapproved', applicationFormType: 'businessLicense' },
                        { name: 'Approved-License Issued', applicationFormType: 'businessLicense' },
                        { name: 'Hold', applicationFormType: 'businessLicense' },
                    ]);
                }
            });
    };

    return ApplicationStatusType;
};
