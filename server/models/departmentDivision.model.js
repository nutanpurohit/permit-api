import * as _ from 'lodash';

let DepartmentDivision;
/**
 * DepartmentDivision Schema
 */
module.exports = (sequelize, DataTypes) => {
    DepartmentDivision = sequelize.define('DepartmentDivision', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED },
        shortCode: { type: DataTypes.STRING },
        claim: { type: DataTypes.STRING(100) },
    });

    DepartmentDivision.sync();

    DepartmentDivision.registerModels = (db) => {
        const { DepartmentType } = db;

        DepartmentDivision.belongsTo(DepartmentType, { foreignKey: 'departmentId' });
    };

    DepartmentDivision.addDefaultRecords = () => {
        DepartmentDivision.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    DepartmentDivision.bulkCreate([
                        {
                            name: 'DRT Collection', departmentId: 11, shortCode: '', claim: 'DRT-COLLECTION',
                        },
                        {
                            name: 'Real Property Tax', departmentId: 11, shortCode: '', claim: 'DRT-RPT',
                        },
                        {
                            name: 'Business License Bureau', departmentId: 11, shortCode: '', claim: 'DRT-BLB',
                        },
                    ]);
                }
            });
    };

    return DepartmentDivision;
};
