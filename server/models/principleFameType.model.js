import * as _ from 'lodash';

let PrincipleFameType;

/**
 * PrincipleFameType Schema
 */
module.exports = (sequelize, DataTypes) => {
    PrincipleFameType = sequelize.define('PrincipleFameType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    PrincipleFameType.sync();

    PrincipleFameType.addDefaultRecords = () => {
        PrincipleFameType.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    PrincipleFameType.bulkCreate([
                        { name: 'Masonry (wall bearing)' },
                        { name: 'Wood frame' },
                        { name: 'L-J Structural steel' },
                        { name: 'Reinforced concrete' },
                    ]);
                }
            });
    };

    return PrincipleFameType;
};
