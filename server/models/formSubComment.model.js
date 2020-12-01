let FormSubComment;

/**
 * FormSubComment Schema
 */

module.exports = (sequelise, DataTypes) => {
    FormSubComment = sequelise.define('FormSubComment', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        parentCommentId: {
            type: DataTypes.BIGINT.UNSIGNED,
        },
        text: {
            type: DataTypes.STRING,
        },
        applicationFormType: { type: DataTypes.STRING },
        attachments: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        createdBy: { type: DataTypes.STRING },
    });

    FormSubComment.sync();

    FormSubComment.registerModels = (db) => {
        const { FormComment, Users } = db;
        FormSubComment.belongsTo(FormComment, { foreignKey: 'parentCommentId' });
        FormSubComment.belongsTo(Users, { foreignKey: 'createdBy' });
    };


    return FormSubComment;
};
