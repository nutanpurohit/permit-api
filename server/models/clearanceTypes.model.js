import * as _ from 'lodash';

let ClearanceType;
/**
 * ClearanceType Schema
 */
module.exports = (sequelize, DataTypes) => {
    ClearanceType = sequelize.define('ClearanceType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    ClearanceType.sync();

    ClearanceType.addDefaultRecords = () => {
        ClearanceType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    ClearanceType.bulkCreate([
                        { name: 'Dept. of Land Management' },
                        { name: 'Dept. of Public Works' },
                        { name: 'Guam Fire Department' },
                        { name: 'Dept. of Public Health & Social Services' },
                        { name: 'Contractor\'s License Board' },
                        { name: 'Guam Visitor\'s Bureau' },
                        { name: 'Dept. of Parks & Recreation' },
                        { name: 'GDOE' },
                        { name: 'Board of Licensure/Cosmetology' },
                        { name: 'Guam Police Department' },
                        { name: 'Other' },
                        { name: 'ISBRE Branch' },
                        { name: 'GRT' },
                        { name: 'Income Tax/W-1 ' },
                        { name: 'Collections' },
                        { name: 'DRT Real Property' },
                        { name: 'MVD' },
                        { name: 'Compliance' },
                        { name: 'Business License' },
                    ]);
                }
            });
    };

    return ClearanceType;
};
