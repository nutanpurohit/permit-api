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
        code: { type: DataTypes.INTEGER },
        codeText: { type: DataTypes.STRING(20) },
        codeLength: { type: DataTypes.INTEGER },
        codeParent: { type: DataTypes.STRING(10) },
        title: { type: DataTypes.TEXT },
        description: { type: DataTypes.TEXT },
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

        NAICSType.hasMany(NAICSDepartmentRelationship, {
            foreignKey: 'naicsId',
        });

        NAICSType.hasOne(NAICSType, {
            as: 'parentNAICS',
            foreignKey: 'codeText',
            sourceKey: 'codeParent',
        });

        NAICSType.hasMany(NAICSType, {
            as: 'childNAICS',
            foreignKey: 'codeParent',
            sourceKey: 'codeText',
        });
    };

    return NAICSType;
};
