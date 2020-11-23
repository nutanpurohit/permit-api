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
    });

    DepartmentType.sync();

    DepartmentType.addDefaultRecords = () => {
        DepartmentType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    DepartmentType.bulkCreate([
                        { name: 'Dept of Public Works', shortCode: '' },
                        { name: 'Guam Fire Department', shortCode: '' },
                        { name: 'Dept of Public Health and Social Services', shortCode: '' },
                        { name: 'Contractor’s License Board', shortCode: '' },
                        { name: 'Guam Visitors Bureau', shortCode: '' },
                        { name: 'Dept of Parks and Recreation', shortCode: '' },
                        { name: 'Guam Department of Education', shortCode: '' },
                        { name: 'Board of Licensure / Cosmetology', shortCode: '' },
                        { name: 'Guam Police Department', shortCode: '' },
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
