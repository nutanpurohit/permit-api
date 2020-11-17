/**
 * AgencyComments Schema
 */
module.exports = (sequelize, DataTypes) => {
    const AgencyComments = sequelize.define('AgencyComments', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        agencyTypeId: { type: DataTypes.BIGINT.UNSIGNED },
        date: { type: DataTypes.DATEONLY },
        signature: { type: DataTypes.STRING(600) },
        response: { type: DataTypes.STRING(600) },
    });

    AgencyComments.sync();

    return AgencyComments;
};
