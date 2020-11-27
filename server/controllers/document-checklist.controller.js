import async from 'async';
import db from '../../config/sequelize';

const {
    document_checklist: DocumentChecklist,
} = db;

function getAll(req, res, next) {
    const {
        applicationTypeId,
    } = req.params;
    const whereCondition = {
        application_type_id: applicationTypeId,
    };
    async.waterfall([
        (cb) => {
            async.parallel({
                documentCheckList: (done) => {
                    DocumentChecklist.findAll({
                        where: whereCondition,
                    })
                        .then((records) => {
                            done(null, records);
                        })
                        .catch(done);
                },
                total: (done) => {
                    DocumentChecklist.count({
                        where: whereCondition,
                    })
                        .then((count) => {
                            return done(null, count);
                        })
                        .catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }
                const processingData = {
                    documentCheckList: parallelRes.documentCheckList,
                    total: parallelRes.total,
                };

                return cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }

        const response = {
            documentCheckList: processingData.documentCheckList,
            total: processingData.total,
        };
        return res.json(response);
    });
}

export default {
    getAll,
};
