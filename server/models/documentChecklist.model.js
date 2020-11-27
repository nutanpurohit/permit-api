let DocumentChecklist;

module.exports = (sequelize, DataTypes) => {
    DocumentChecklist = sequelize.define('document_checklist', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        text: { type: DataTypes.TEXT },
        application_type_id: { type: DataTypes.INTEGER },
        document_type: { type: DataTypes.CHAR },
        created_on: { type: DataTypes.DATEONLY },
        update_on: { type: DataTypes.DATEONLY },
        created_by: { type: DataTypes.TEXT },
        update_by: { type: DataTypes.TEXT },
        is_active: { type: DataTypes.BOOLEAN },
    }, {
        timestamps: false,
        freezeTableName: true,
    });

    DocumentChecklist.sync();
    return DocumentChecklist;
};
