/**
 * FormAttachment Schema
 */
module.exports = (sequelize, DataTypes) => {
    const FormAttachment = sequelize.define('FormAttachment', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        documentName: { type: DataTypes.STRING },
        documentSequence: { type: DataTypes.INTEGER },
        documentType: { type: DataTypes.STRING },
        url: { type: DataTypes.STRING(300) },
        applicationFormType: { type: DataTypes.STRING },
        fileType: { type: DataTypes.STRING },
    });

    FormAttachment.sync();

    return FormAttachment;
};
