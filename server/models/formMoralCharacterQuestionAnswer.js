/**
 * FormMoralCharacterQuestionAnswer Schema
 */
module.exports = (sequelize, DataTypes) => {
    const FormMoralCharacterQuestionAnswer = sequelize.define('FormMoralCharacterQuestionAnswer', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        applicationFormId: { type: DataTypes.BIGINT.UNSIGNED },
        applicationFormType: { type: DataTypes.STRING },
        questionId: { type: DataTypes.BIGINT.UNSIGNED },
        answerId: { type: DataTypes.BIGINT.UNSIGNED },
        answerExplanation: { type: DataTypes.STRING(600) },
    });

    FormMoralCharacterQuestionAnswer.sync();

    FormMoralCharacterQuestionAnswer.registerModels = (db) => {
        const {
            AnswerType,
            MoralCharacterQuestion,
        } = db;

        FormMoralCharacterQuestionAnswer.belongsTo(AnswerType, { foreignKey: 'answerId' });
        FormMoralCharacterQuestionAnswer.belongsTo(MoralCharacterQuestion, { foreignKey: 'questionId' });
    };

    return FormMoralCharacterQuestionAnswer;
};
