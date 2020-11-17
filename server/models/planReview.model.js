/**
 * PlanReview Schema
 */
module.exports = (sequelize, DataTypes) => {
    const PlanReview = sequelize.define('PlanReview', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        planReviewTypeId: { type: DataTypes.BIGINT.UNSIGNED },
        planStartDate: { type: DataTypes.DATEONLY },
        planApproveDate: { type: DataTypes.DATEONLY },
        comments: { type: DataTypes.STRING(600) },
    });

    PlanReview.sync();

    return PlanReview;
};
