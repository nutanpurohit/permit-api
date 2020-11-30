let FormComment;

/**
 * FormComment Schema
 */
module.exports = (sequelize, DataTypes) => {
    FormComment = sequelize.define('FormComment', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        isPublish: { type: DataTypes.BOOLEAN },
        formId: { type: DataTypes.BIGINT.UNSIGNED },
        text: { type: DataTypes.TEXT },
        applicationFormType: { type: DataTypes.STRING },
        applicationStatus: { type: DataTypes.BIGINT.UNSIGNED },
        attachments: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        createdBy: { type: DataTypes.STRING },
        readStatus: { type: DataTypes.BOOLEAN },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED },
        departmentDivisionId: { type: DataTypes.BIGINT.UNSIGNED },
    });

    FormComment.sync();

    FormComment.registerModels = (db) => {
        const { FormSubComment } = db;
        FormComment.hasMany(FormSubComment, { foreignKey: 'parentCommentId' });
    };
    return FormComment;
};
