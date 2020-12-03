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
        departmentDivisionId: { type: DataTypes.BIGINT.UNSIGNED },
        reviewStatus: { type: DataTypes.BIGINT.UNSIGNED },
    });

    BusinessLicenseAgencyReview.sync();

    BusinessLicenseAgencyReview.registerModels = (db) => {
        const { DepartmentType, DepartmentDivision } = db;

        BusinessLicenseAgencyReview.belongsTo(DepartmentType, { foreignKey: 'departmentId' });
        BusinessLicenseAgencyReview.belongsTo(DepartmentDivision, { foreignKey: 'departmentDivisionId' });
    };

    return BusinessLicenseAgencyReview;
};
