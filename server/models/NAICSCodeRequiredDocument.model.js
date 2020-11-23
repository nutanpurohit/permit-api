import * as _ from 'lodash';

let NAICSCodeRequiredDocument;
/**
 * NAICSCodeRequiredDocument Schema
 */
module.exports = (sequelize, DataTypes) => {
    NAICSCodeRequiredDocument = sequelize.define('NAICSCodeRequiredDocument', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        NAICSTypeId: { type: DataTypes.BIGINT.UNSIGNED },
        DocumentName: { type: DataTypes.STRING },
        isRequired: { type: DataTypes.BOOLEAN },
    });

    NAICSCodeRequiredDocument.sync();

    NAICSCodeRequiredDocument.addDefaultRecords = () => {
        NAICSCodeRequiredDocument.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    // TODO
                }
            });
    };

    return NAICSCodeRequiredDocument;
};
