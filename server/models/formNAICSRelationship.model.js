let FormNAICSRelationship;

/**
 * FormNAICSRelationship Schema
 */
module.exports = (sequelize, DataTypes) => {
    FormNAICSRelationship = sequelize.define('FormNAICSRelationship', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        naicsId: { type: DataTypes.BIGINT.UNSIGNED },
        applicationFormId: { type: DataTypes.BIGINT.UNSIGNED },
        applicationFormType: { type: DataTypes.STRING },
    });

    FormNAICSRelationship.sync();

    FormNAICSRelationship.registerModels = (db) => {
        const { NAICSType } = db;

        FormNAICSRelationship.belongsTo(NAICSType, { foreignKey: 'naicsId' });
    };

    return FormNAICSRelationship;
};
