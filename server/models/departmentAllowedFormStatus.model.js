import * as _ from 'lodash';

let DepartmentAllowedFormStatus;

/**
 * DepartmentAllowedFormStatus Schema
 */
module.exports = (sequelize, DataTypes) => {
    DepartmentAllowedFormStatus = sequelize.define('DepartmentAllowedFormStatus', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        departmentId: { type: DataTypes.BIGINT.UNSIGNED },
        departmentDivisionId: { type: DataTypes.BIGINT.UNSIGNED },
        applicationFormType: { type: DataTypes.STRING },
        allowedApplicationStatusIds: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        allowedAssignedApplicationStatusIds: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        allowedUnAssignedApplicationStatusIds: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
    });

    DepartmentAllowedFormStatus.sync();

    DepartmentAllowedFormStatus.addDefaultRecords = () => {
        DepartmentAllowedFormStatus.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    DepartmentAllowedFormStatus.bulkCreate([
                        {
                            departmentId: 11,
                            departmentDivisionId: 3,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [2, 3, 7, 10, 13, 16, 17, 18, 19, 20],
                            allowedUnAssignedApplicationStatusIds: [4, 5, 6, 8, 9, 11, 12, 14, 15],
                        },
                        {
                            departmentId: 11,
                            departmentDivisionId: 2,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [5, 6, 7],
                            allowedUnAssignedApplicationStatusIds: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 12,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [8, 9, 10],
                            allowedUnAssignedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 1,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 2,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 3,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 4,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 5,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 6,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 7,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 8,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 9,
                            departmentDivisionId: null,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [11, 12, 13],
                            allowedUnAssignedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                        },
                        {
                            departmentId: 11,
                            departmentDivisionId: 1,
                            applicationFormType: 'businessLicense',
                            allowedApplicationStatusIds: [14, 15, 16, 17, 18, 19, 20],
                            allowedAssignedApplicationStatusIds: [14, 15, 16],
                            allowedUnAssignedApplicationStatusIds: [17, 18, 19, 20],
                        },
                    ]);
                }
            });
    };

    return DepartmentAllowedFormStatus;
};
