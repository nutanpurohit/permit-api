import * as _ from 'lodash';

/**
 * PlanReviewType Schema
 */
module.exports = (sequelize, DataTypes) => {
    const PlanReviewType = sequelize.define('PlanReviewType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    PlanReviewType.sync();

    PlanReviewType.addDefaultRecords = () => {
        PlanReviewType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    PlanReviewType.bulkCreate([
                        { name: 'Architectural' },
                        { name: 'Structural' },
                        { name: 'Mechanical/Plumbing' },
                        { name: 'Flood Control' },
                        { name: 'Electrical' },
                        { name: 'HPCC' },
                        { name: 'Hydraulics/Civil' },
                        { name: 'Highway Encroachment' },
                        { name: 'Rights of Way' },
                        { name: 'Traffic Engineering' },
                    ]);
                }
            });
    };

    return PlanReviewType;
};
