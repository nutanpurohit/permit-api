/**
 * BusinessLicenseApplication Schema
 */
module.exports = (sequelize, DataTypes) => {
    const BusinessLicenseApplication = sequelize.define('BusinessLicenseApplication', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        UBLNo: { type: DataTypes.STRING(300) },
        clearanceTypeIds: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        ssn: { type: DataTypes.STRING(300) },
        ein: { type: DataTypes.STRING(300) },
        cellPhoneNo: { type: DataTypes.STRING(300) },
        officeNo: { type: DataTypes.STRING(300) },
        email: { type: DataTypes.STRING(300) },
        GRTAccountNo: { type: DataTypes.STRING(300) },
        BLBComments: { type: DataTypes.STRING(600) },
        applicantFullName: { type: DataTypes.STRING(400) },
        registrationNo: { type: DataTypes.STRING(300) },
        mailingAddress: { type: DataTypes.STRING(600) },
        businessLocation: { type: DataTypes.STRING(600) },
        businessActivityDescription: { type: DataTypes.STRING(600) },
        businessAs: { type: DataTypes.STRING(300) },
        organizationTypeId: { type: DataTypes.BIGINT.UNSIGNED },
        isApplicantRealPartyInterest: { type: DataTypes.BOOLEAN },
        partyName: { type: DataTypes.STRING(300) },
        partyAddress: { type: DataTypes.STRING(600) },
        applicantSignature: { type: DataTypes.STRING(600) },
        applicantTitle: { type: DataTypes.STRING(300) },
        submitDate: { type: DataTypes.DATEONLY },
        branchIsApplicantRealPartyInterest: { type: DataTypes.BOOLEAN },
        branchRemarks: { type: DataTypes.STRING(600) },
        branchApproveDate: { type: DataTypes.DATEONLY },
        issuedLicenseNo: { type: DataTypes.STRING(300) },
        applicationStatusId: { type: DataTypes.BIGINT.UNSIGNED },
        attachments: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
    });

    BusinessLicenseApplication.sync();

    return BusinessLicenseApplication;
};
