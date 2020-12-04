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
                            name: 'DRT Collection', departmentId: 11, shortCode: 'COLLECTION', claim: 'DRT-COLLECTION',
                        },
                        {
                            name: 'Real Property Tax', departmentId: 11, shortCode: 'RPT', claim: 'DRT-RPT',
                        },
                        {
                            name: 'Business License Bureau', departmentId: 11, shortCode: 'BLB', claim: 'DRT-BLB',
                        },
                        {
                            name: 'DRT Insurance, Securities, Banking, and Real Estate Branch', departmentId: 11, shortCode: 'ISBRE Branch', claim: 'DRT-ISBRE',
                        },
                        {
                            name: 'DRT Business Privilege Tax Branch', departmentId: 11, shortCode: 'BPTB', claim: 'DRT-BPTB',
                        },
                        {
                            name: 'DRT Income Tax Assistance and Processing Branch', departmentId: 11, shortCode: 'ITAPB', claim: 'DRT-ITAPB',
                        },
                        {
                            name: 'DRT Compliance Branch', departmentId: 11, shortCode: 'Compliance', claim: 'DRT-COMPLIANCE',
                        },
                    ]);
                }
            });
    };

    return DepartmentDivision;
};
