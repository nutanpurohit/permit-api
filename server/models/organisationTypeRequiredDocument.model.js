import * as _ from 'lodash';

let OrganisationTypeRequiredDocument;
/**
 * OrganisationTypeRequiredDocument Schema
 */
module.exports = (sequelize, DataTypes) => {
    OrganisationTypeRequiredDocument = sequelize.define('OrganisationTypeRequiredDocument', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        organizationTypeId: { type: DataTypes.BIGINT.UNSIGNED },
        DocumentName: { type: DataTypes.STRING },
        isRequired: { type: DataTypes.BOOLEAN },
    });

    OrganisationTypeRequiredDocument.sync();

    OrganisationTypeRequiredDocument.addDefaultRecords = () => {
        OrganisationTypeRequiredDocument.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    // TODO
                }
            });
    };

    return OrganisationTypeRequiredDocument;
};
