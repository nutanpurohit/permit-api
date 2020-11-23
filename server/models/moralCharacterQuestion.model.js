import * as _ from 'lodash';

let MoralCharacterQuestion;
/**
 * MoralCharacterQuestion Schema
 */
module.exports = (sequelize, DataTypes) => {
    MoralCharacterQuestion = sequelize.define('MoralCharacterQuestion', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        question: { type: DataTypes.STRING },
        answers: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        answerExplanationOn: { type: DataTypes.BIGINT.UNSIGNED },
        explanationText: { type: DataTypes.ARRAY(DataTypes.STRING) },
        isDefault: { type: DataTypes.BOOLEAN },
        applicationFormType: { type: DataTypes.STRING },
    });

    MoralCharacterQuestion.sync();

    MoralCharacterQuestion.addDefaultRecords = () => {
        MoralCharacterQuestion.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    // TODO
                }
            });
    };

    return MoralCharacterQuestion;
};
