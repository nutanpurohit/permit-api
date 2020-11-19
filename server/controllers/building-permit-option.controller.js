import async from 'async';
import httpStatus from 'http-status';
import db from '../../config/sequelize';

const {
    BuildingType,
    IdentificationType,
    MechanicalType,
    NonResidential,
    PrincipleFameType,
    Residential,
    SewageDisposalType,
    WaterSupplyType,
    OwnershipType,
    PlanReviewType,
    AgencyType,
    ApplicationStatusType,
} = db;


/**
 * Returns all the options
 *
 * @param req - The http request object
 * @param res - The http response object
 * @param next - The callback function
 */
function getAll(req, res, next) {
    async.parallel({
        buildingTypes: (cb) => {
            BuildingType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        identificationTypes: (cb) => {
            IdentificationType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        mechanicalTypes: (cb) => {
            MechanicalType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        nonResidentials: (cb) => {
            NonResidential
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        ownershipTypes: (cb) => {
            OwnershipType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        principleFameTypes: (cb) => {
            PrincipleFameType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        residentials: (cb) => {
            Residential
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        sewageDisposalTypes: (cb) => {
            SewageDisposalType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        waterSupplyTypes: (cb) => {
            WaterSupplyType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        planReviewTypes: (cb) => {
            PlanReviewType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        agencyTypes: (cb) => {
            AgencyType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
        applicationStatusTypes: (cb) => {
            ApplicationStatusType
                .findAll()
                .then((allTypes) => cb(null, allTypes))
                .catch((err) => {
                    cb(err);
                });
        },
    }, (err, parallelResult) => {
        if (err) {
            const e = new Error('An error occurred while finding the permit options');
            e.status = httpStatus.INTERNAL_SERVER_ERROR;
            return next(e);
        }

        return res.json(parallelResult);
    });
}


export default {
    getAll,
};
