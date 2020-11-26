let DepartmentReviewAnswer;

module.exports = (sequelise, DataTypes) => {
    DepartmentReviewAnswer = sequelise.define('DepartmentReviewAnswer', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        departmentReviewQuestionId: { type: DataTypes.BIGINT.UNSIGNED },
        applicationFormId: { type: DataTypes.BIGINT.UNSIGNED },
        applicationFormType: { type: DataTypes.STRING },
        answerId: { type: DataTypes.BIGINT.UNSIGNED },
        answerExplanation: { type: DataTypes.STRING },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED },
        departmentDivisionId: { type: DataTypes.BIGINT.UNSIGNED },
    });

    DepartmentReviewAnswer.sync();
    DepartmentReviewAnswer.registerModels = (db) => {
        const { DepartmentType, DepartmentDivision, DepartmentReviewQuestion } = db;
        DepartmentReviewAnswer.belongsTo(DepartmentReviewQuestion, { foreignKey: 'departmentReviewQuestionId' });
        DepartmentReviewAnswer.belongsTo(DepartmentType, { foreignKey: 'departmentId' });
        DepartmentReviewAnswer.belongsTo(DepartmentDivision, { foreignKey: 'departmentDivisionId' });
    };
    return DepartmentReviewAnswer;
};
