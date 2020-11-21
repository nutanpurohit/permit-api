let NAICSDepartmentRelationship;

/**
 * NAICSDepartmentRelationship Schema
 */
module.exports = (sequelize, DataTypes) => {
    NAICSDepartmentRelationship = sequelize.define('NAICSDepartmentRelationship', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        naicsId: { type: DataTypes.BIGINT.UNSIGNED },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED },
    });

    NAICSDepartmentRelationship.sync();

    NAICSDepartmentRelationship.registerModels = (db) => {
        const { NAICSType, DepartmentType } = db;

        NAICSDepartmentRelationship.belongsTo(NAICSType, { foreignKey: 'naicsId' });
        NAICSDepartmentRelationship.belongsTo(DepartmentType, { foreignKey: 'departmentId' });
    };

    return NAICSDepartmentRelationship;
};
