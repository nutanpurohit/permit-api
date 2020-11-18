let CostBuildingPermit;

/**
 * CostBuildingPermit Schema
 */
module.exports = (sequelize, DataTypes) => {
    CostBuildingPermit = sequelize.define('CostBuildingPermit', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        costTypeId: { type: DataTypes.BIGINT.UNSIGNED },
        cost: { type: DataTypes.INTEGER },
    });

    CostBuildingPermit.sync();

    return CostBuildingPermit;
};
