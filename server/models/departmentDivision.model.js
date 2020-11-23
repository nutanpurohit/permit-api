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
        shortCode: { type: DataTypes.STRING },
    });

    DepartmentDivision.sync();

    DepartmentDivision.addDefaultRecords = () => {
        DepartmentDivision.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    // TODO
                }
            });
    };

    return DepartmentDivision;
};
