import * as _ from 'lodash';

let OrganizationType;
/**
 * OrganizationType Schema
 */
module.exports = (sequelize, DataTypes) => {
    OrganizationType = sequelize.define('OrganizationType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    OrganizationType.sync();

    OrganizationType.addDefaultRecords = () => {
        OrganizationType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    OrganizationType.bulkCreate([
                        { name: 'CORPORATION' },
                        { name: 'LIMITED LIABILITY COMPANY' },
                        { name: 'PARTNERSHIP' },
                        { name: 'LIMITED PARTNERSHIP' },
                        { name: 'SOLE PROPRIETORSHIP' },
                        { name: 'LIMITED LIABILITY PARTNERSHIP' },
                        { name: 'WHOLESALE' },
                        { name: 'RETAIL' },
                        { name: 'SERVICE' },
                        { name: 'SERVICE RENTAL' },
                        { name: 'HOME INDUSTRY' },
                        { name: 'HAND MANUFACTURE' },
                        { name: 'COIN VENDING' },
                        { name: 'MACHINE MANUFACTURE' },
                        { name: 'TEMPORARY' },
                    ]);
                }
            });
    };

    return OrganizationType;
};
