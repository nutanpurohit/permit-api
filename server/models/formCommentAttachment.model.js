/**
 * CommentAttachment Schema
 */
module.exports = (sequelize, DataTypes) => {
    const FormCommentAttachment = sequelize.define('FormCommentAttachment', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        documentName: { type: DataTypes.STRING },
        url: { type: DataTypes.STRING(300) },
        fileType: { type: DataTypes.STRING },
    });

    FormCommentAttachment.sync();

    return FormCommentAttachment;
};
