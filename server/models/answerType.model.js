/**
 * AnswerType Type Schema
 */
import * as _ from 'lodash';

let AnswerType;

module.exports = (sequelize, DataTypes) => {
    AnswerType = sequelize.define('AnswerType', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING },
    });

    AnswerType.sync();

    AnswerType.addDefaultRecords = () => {
        AnswerType.findAll()
            .then((answerTypes) => {
                if (_.isEmpty(answerTypes)) {
                    AnswerType.bulkCreate([
                        { name: 'YES' },
                        { name: 'NO' },
                        { name: 'Other' },
                        { name: 'N/A' },
                    ]);
                }
            });
    };

    return AnswerType;
};
