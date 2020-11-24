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
                    MoralCharacterQuestion.bulkCreate([
                        { question: 'Have you ever been licensed to perate a business?' },
                        {
                            question: 'Have you ever had a business license canselled,suspended, or revoked?', answers: [1, 2], answerExplanationOn: 1, explanationText: ['If yes, please explain'], isDefault: false, applicationFormType: 'businessLicense',
                        },
                        {
                            question: 'Have you ever been refused a business license for any reason?', answers: [1, 2], answerExplanationOn: 1, explanationText: ['If yes, please explain'], isDefault: false, applicationFormType: 'businessLicense',
                        },
                        {
                            question: 'Have you ever been arrested for any violation of the other than a minor trafis violation?', answers: [1, 2], answerExplanationOn: 1, explanationText: ['If yes, please state the violation and results of the court action'], isDefault: false, applicationFormType: 'businessLicense',
                        },
                        {
                            question: 'Are there any reasons other than the above which preclude you from being issued a business license?', answers: [1, 2], answerExplanationOn: 1, explanationText: ['If yes, please explain'], isDefault: false, applicationFormType: 'businessLicense',
                        },
                        {
                            question: 'I swear that the following information I have provided here in true and correct to the best of my nowledge and belief.', answers: [1, 2], isDefault: true, applicationFormType: 'businessLicense',
                        },
                    ]);
                }
            });
    };

    return MoralCharacterQuestion;
};
