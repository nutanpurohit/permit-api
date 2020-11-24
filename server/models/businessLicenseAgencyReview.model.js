/**
 * BusinessLicenseAgencyReview Schema
 */
module.exports = (sequelize, DataTypes) => {
    const BusinessLicenseAgencyReview = sequelize.define('BusinessLicenseAgencyReview', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        applicationFormId: { type: DataTypes.BIGINT.UNSIGNED },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED },
        reviewStatus: { type: DataTypes.STRING },
    });

    BusinessLicenseAgencyReview.sync();

    return BusinessLicenseAgencyReview;
};
