/**
 * Building permit Schema
 */
module.exports = (sequelize, DataTypes) => {
    const BuildingPermit = sequelize.define('BuildingPermits', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        locationNo: { type: DataTypes.STRING },
        locationStreet: { type: DataTypes.STRING(300) },
        zoningDistrict: { type: DataTypes.STRING(300) },
        crossStreet1: { type: DataTypes.STRING(300) },
        crossStreet2: { type: DataTypes.STRING(300) },
        subDivision: { type: DataTypes.STRING(300) },
        block: { type: DataTypes.STRING(300) },
        lotSize: { type: DataTypes.BIGINT.UNSIGNED },
        groupOccupancy: { type: DataTypes.STRING(300) },
        constructionType: { type: DataTypes.STRING(300) },
        foundation: { type: DataTypes.STRING(300) },
        buildingType: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        otherBuildingType: { type: DataTypes.STRING(300) },
        buildingDimension: { type: DataTypes.STRING(300) },
        ownership: { type: DataTypes.BIGINT },
        improvementsCost: { type: DataTypes.BIGINT.UNSIGNED },
        electricalCost: { type: DataTypes.BIGINT.UNSIGNED },
        plumbingCost: { type: DataTypes.BIGINT.UNSIGNED },
        heatingAndACCost: { type: DataTypes.BIGINT.UNSIGNED },
        otherCost: { type: DataTypes.BIGINT.UNSIGNED },
        improvementCostTotal: { type: DataTypes.BIGINT.UNSIGNED },
        nonResidentialPurpose: { type: DataTypes.STRING(600) },

        residential: { type: DataTypes.BIGINT.UNSIGNED },
        residentialNoOfFamily: { type: DataTypes.BIGINT.UNSIGNED },
        residentialNoOfHotelMotel: { type: DataTypes.BIGINT.UNSIGNED },
        otherResidential: { type: DataTypes.STRING },


        nonResidential: { type: DataTypes.BIGINT.UNSIGNED },
        otherNonResidential: { type: DataTypes.STRING },

        principalTypeOfFrame: { type: DataTypes.BIGINT.UNSIGNED },
        otherPrincipalTypeOfFrame: { type: DataTypes.STRING(300) },

        sewageDisposalType: { type: DataTypes.BIGINT.UNSIGNED },

        mechanicalType: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },

        waterSupplyType: { type: DataTypes.BIGINT.UNSIGNED },

        noOfStories: { type: DataTypes.BIGINT.UNSIGNED },

        exteriorDimensions: { type: DataTypes.STRING },

        totalLandArea: { type: DataTypes.STRING },

        enclosedParking: { type: DataTypes.BIGINT.UNSIGNED },
        outdoorsParking: { type: DataTypes.BIGINT.UNSIGNED },

        noOfBedRoom: { type: DataTypes.BIGINT.UNSIGNED },
        noOfBedRoomFull: { type: DataTypes.BIGINT.UNSIGNED },
        noOfBedRoomPartial: { type: DataTypes.BIGINT.UNSIGNED },
        indentificationIds: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        ownerLesor: { type: DataTypes.STRING },
        currentAddress: { type: DataTypes.STRING(300) },
        applicationDate: { type: DataTypes.DATEONLY },

        planReviewIds: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
        district: { type: DataTypes.STRING(300) },
        use: { type: DataTypes.STRING(300) },
        frontYard: { type: DataTypes.STRING(300) },
        sideYard: { type: DataTypes.STRING(300) },
        rearYard: { type: DataTypes.STRING(300) },
        leaseOrAuthorization: { type: DataTypes.STRING(300) },
        TLUCApprovalCondition: { type: DataTypes.STRING(600) },
        agencyCommentIds: { type: DataTypes.ARRAY(DataTypes.BIGINT.UNSIGNED) },
    });

    return BuildingPermit;
};
