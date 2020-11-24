import async from 'async';
import db from '../../config/sequelize';


const {
    MoralCharacterQuestion,
    AnswerType,
} = db;

function getAll(req, res, next) {
    const whereCondition = getAllWhereCondition(req.query);

    async.waterfall([
        (cb) => {
            async.parallel({
                questions: (done) => {
                    MoralCharacterQuestion.findAll({
                        where: whereCondition,
                        order: [
                            ['id', 'ASC'],
                        ],
                    })
                        .then((records) => {
                            done(null, records);
                        })
                        .catch(done);
                },
                total: (done) => {
                    MoralCharacterQuestion.count({
                        where: whereCondition,
                    })
                        .then((count) => {
                            return done(null, count);
                        })
                        .catch(done);
                },
                answer: (done) => {
                    AnswerType.findAll({

                    }).then((records) => {
                        done(null, records);
                    })
                        .catch(done);
                },
            }, (parallelErr, parallelRes) => {
                if (parallelErr) {
                    return cb(parallelErr);
                }

                const processingData = {
                    questions: parallelRes.questions,
                    total: parallelRes.total,
                    answer: parallelRes.answer,
                };

                return cb(null, processingData);
            });
        },
    ], (err, processingData) => {
        if (err) {
            return next(err);
        }

        const response = {
            questions: processingData.questions,
            total: processingData.total,
            answer: processingData.answer,
        };

        return res.json(response);
    });
}


export default {
    getAll,
};


const getAllWhereCondition = (query) => {
    const whereCondition = {};

    if (query.applicationFormType) {
        whereCondition.applicationFormType = query.applicationFormType;
    }

    return whereCondition;
};
