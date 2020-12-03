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
                        { name: 'Dept of Public Works', shortCode: 'DPW', claim: 'Dept of Public Works' },
                        { name: 'Guam Fire Department', shortCode: 'GFD', claim: 'Guam Fire Department' },
                        { name: 'Dept of Public Health and Social Services', shortCode: 'DPHSS', claim: 'Dept of Public Health and Social Services' },
                        { name: 'Contractor’s License Board', shortCode: 'CLB', claim: 'Contractor’s License Board' },
                        { name: 'Guam Visitors Bureau', shortCode: 'GVB', claim: 'Guam Visitors Bureau' },
                        { name: 'Dept of Parks and Recreation', shortCode: 'DPR', claim: 'Dept of Parks and Recreation' },
                        { name: 'Guam Department of Education', shortCode: 'GDOE', claim: 'Guam Department of Education' },
                        { name: 'Board of Licensure / Cosmetology', shortCode: 'BLC', claim: 'Board of Licensure / Cosmetology' },
                        { name: 'Guam Police Department', shortCode: 'GPD', claim: 'Guam Police Department' },
                        { name: 'Dept of Revenue and Tax', shortCode: 'DRT', claim: 'Dept of Revenue and Tax' },
                        { name: 'Dept of Land Management', shortCode: 'DLM', claim: 'Dept of Land Management' },
                        { name: 'Dept of Motor Vehicle', shortCode: 'DMV', claim: 'Dept of Motor Vehicle' },
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
