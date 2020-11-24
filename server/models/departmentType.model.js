import * as _ from 'lodash';

let DepartmentType;
/**
 * DepartmentType Schema
 */
module.exports = (sequelize, DataTypes) => {
    DepartmentType = sequelize.define('DepartmentType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
        shortCode: { type: DataTypes.STRING },
        claim: { type: DataTypes.STRING(100) },
    });

    DepartmentType.sync();

    DepartmentType.addDefaultRecords = () => {
        DepartmentType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    DepartmentType.bulkCreate([
                        { name: 'Dept of Public Works', shortCode: '', claim: 'Dept of Public Works' },
                        { name: 'Guam Fire Department', shortCode: '', claim: 'Guam Fire Department' },
                        { name: 'Dept of Public Health and Social Services', shortCode: '', claim: 'Dept of Public Health and Social Services' },
                        { name: 'Contractor’s License Board', shortCode: '', claim: 'Contractor’s License Board' },
                        { name: 'Guam Visitors Bureau', shortCode: '', claim: 'Guam Visitors Bureau' },
                        { name: 'Dept of Parks and Recreation', shortCode: '', claim: 'Dept of Parks and Recreation' },
                        { name: 'Guam Department of Education', shortCode: '', claim: 'Guam Department of Education' },
                        { name: 'Board of Licensure / Cosmetology', shortCode: '', claim: 'Board of Licensure / Cosmetology' },
                        { name: 'Guam Police Department', shortCode: '', claim: 'Guam Police Department' },
                        { name: 'Dept of Revenue and Tax', shortCode: '', claim: 'Dept of Revenue and Tax' },
                        { name: 'Dept of Land Management', shortCode: '', claim: 'Dept of Land Management' },
                    ]);
                }
            });
    };

    DepartmentType.registerModels = (db) => {
        const { NAICSDepartmentRelationship } = db;

        DepartmentType.hasMany(NAICSDepartmentRelationship, { foreignKey: 'departmentId' });
    };

    return DepartmentType;
};
