import * as _ from 'lodash';
import moment from 'moment';

let FormConfig;

/**
 * FormConfig Schema
 */
module.exports = (sequelize, DataTypes) => {
    FormConfig = sequelize.define('FormConfig', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        sequenceNo: { type: DataTypes.INTEGER },
        fiscalYear: { type: DataTypes.STRING },
        prefix: { type: DataTypes.STRING },
        formType: { type: DataTypes.STRING },
        formField: { type: DataTypes.STRING },
    });

    FormConfig.sync();

    FormConfig.addDefaultRecords = () => {
        FormConfig.findAll()
            .then((types) => {
                if (_.isEmpty(types)) {
                    FormConfig.bulkCreate([
                        {
                            sequenceNo: 1,
                            fiscalYear: getFiscalYear(),
                            prefix: 'P',
                            formType: 'buildingPermit',
                            formField: 'permitNo',
                        },
                        {
                            sequenceNo: 1,
                            fiscalYear: getFiscalYear().substr(2),
                            prefix: 'PA',
                            formType: 'buildingPermit',
                            formField: 'applicationNo',
                        },
                        {
                            sequenceNo: 1,
                            fiscalYear: getFiscalYear().substr(2),
                            prefix: 'B',
                            formType: 'buildingPermit',
                            formField: 'buildingPermitNo',
                        },
                    ]);
                }
            });
    };

    return FormConfig;
};

const getFiscalYear = () => {
    const currentDate = moment(new Date(), 'YYYY/MM/DD');
    const currentMonth = currentDate.format('M');
    let fiscalYear = '';
    if (currentMonth >= 10) {
        fiscalYear = currentDate.format('YYYY');
    } else {
        fiscalYear = moment(new Date()).subtract(1, 'years').format('YYYY');
    }

    return fiscalYear;
};
