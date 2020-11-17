/**
 * Building permit Schema
 */
module.exports = (sequelize, DataTypes) => {
    const BuildingPermit = sequelize.define('BuildingPermits', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        locationNo: { type: DataTypes.STRING },
        locationStreet: { type: DataTypes.STRING(300) },
        zoningDistrict: { type: DataTypes.STRING(300) },
        crossStreet1: { type: DataTypes.STRING(300) },
        crossStreet2: { type: DataTypes.STRING(300) },
        subDivision: { type: DataTypes.STRING(300) },
        block: { type: DataTypes.STRING(300) },
        lotSize: { type: DataTypes.BIGINT.UNSIGNED },
        groupOccupancy: { type: DataTypes.STRING(300) },
        constructionType: { type: DataTypes.STRING(300) },
        foundation: { type: DataTypes.STRING(300) },
        buildingType: { type: DataTypes.STRING(300) },
        otherBuildingType: { type: DataTypes.STRING(300) },
        buildingDimension: { type: DataTypes.STRING(300) },
        ownership: { type: DataTypes.STRING(300) },
        improvementsCost: { type: DataTypes.BIGINT.UNSIGNED },
        electricalCost: { type: DataTypes.BIGINT.UNSIGNED },
        plumbingCost: { type: DataTypes.BIGINT.UNSIGNED },
        heatingAndACCost: { type: DataTypes.BIGINT.UNSIGNED },
        otherCost: { type: DataTypes.BIGINT.UNSIGNED },
    });

    return BuildingPermit;
};
