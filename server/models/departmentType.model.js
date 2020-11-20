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
    });

    DepartmentType.sync();

    DepartmentType.addDefaultRecords = () => {
        DepartmentType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    DepartmentType.bulkCreate([
                        { name: 'Dept of Public Works' },
                        { name: 'Guam Fire Department' },
                        { name: 'Dept of Public Health and Social Services' },
                        { name: 'Contractor’s License Board' },
                        { name: 'Guam Visitors Bureau' },
                        { name: 'Dept of Parks and Recreation' },
                        { name: 'Guam Department of Education' },
                        { name: 'Board of Licensure / Cosmetology' },
                        { name: 'Guam Police Department' },
                    ]);
                }
            });
    };

    return DepartmentType;
};
