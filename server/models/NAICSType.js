import * as _ from 'lodash';
import NAICSCode from '../dataFiles/NAICSCodes';

let NAICSType;
/**
 * NAICSType Schema
 */
module.exports = (sequelize, DataTypes) => {
    NAICSType = sequelize.define('NAICSType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        sequenceNo: { type: DataTypes.INTEGER },
        shortCode: { type: DataTypes.STRING(4) },
        NAICSGroup: { type: DataTypes.STRING },
        code: { type: DataTypes.STRING(8) },
        title: { type: DataTypes.STRING },
        year: { type: DataTypes.INTEGER },
        status: { type: DataTypes.STRING(20) },
    });

    NAICSType.sync();

    NAICSType.addDefaultRecords = () => {
        NAICSType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    NAICSType.bulkCreate(NAICSCode);
                }
            });
    };

    NAICSType.registerModels = (db) => {
        const { NAICSDepartmentRelationship } = db;

        NAICSType.hasMany(NAICSDepartmentRelationship, { foreignKey: 'naicsId' });
    };

    return NAICSType;
};
