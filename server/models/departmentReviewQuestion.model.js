
let DepartmentReviewQuestion;

module.exports = (sequelize, DataType) => {
    DepartmentReviewQuestion = sequelize.define('DepartmentReviewQuestion', {
        id: {
            type: DataType.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        assessmentCriteria: { type: DataType.TEXT },
        effectArea: { type: DataType.STRING },
        noImpact: { type: DataType.BIGINT.UNSIGNED },
        additionalInformationOn: { type: DataType.BIGINT.UNSIGNED },
        departmentId: { type: DataType.BIGINT.UNSIGNED },
        departmentDivisionId: { type: DataType.BIGINT.UNSIGNED },
        active: { type: DataType.BOOLEAN },
    });

    DepartmentReviewQuestion.sync();
    DepartmentReviewQuestion.registerModels = (db) => {
        const { DepartmentType, DepartmentDivision } = db;

        DepartmentReviewQuestion.belongsTo(DepartmentType, { foreignKey: 'departmentId' });
        DepartmentReviewQuestion.belongsTo(DepartmentDivision, { foreignKey: 'departmentDivisionId' });
    };

    return DepartmentReviewQuestion;
};
