
const {
    runEAccountWorkflow,runECifWorkflow,runEAccountAndECifWorkflow
} = require("../service/workflow.ecif.eacc.service");
const logger = require('../logger');
const {getMessage} = require('../util/messages');
module.exports = {

    /**
     *  Run Workflow on E-Account
     * */
    runEAccountWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runEAccountWorkflow');
            await runEAccountWorkflow(id, body, (response) => {
                if (response.status === 400 || response.status === 204) {
                    return res.status(response.status).json({
                        status: response.status,
                        message: response.message,
                        data: null
                    });
                }
                return res.status(response.status).json({
                    status: response.status,
                    message: response.message,
                    data: response.data
                });
            });
        } catch (error) {
            logger.error(error.message);
            return res.status(500).json({
                status: 500,
                message: getMessage('internal.server.error'),
                data: null
            });
        }
    },

    /**
     * Run Workflow on E-CIF
     * */
    runECifWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runECifWorkflow');
            await runECifWorkflow(id, body, (response) => {
                if (response.status === 400 || response.status === 204) {
                    return res.status(response.status).json({
                        status: response.status,
                        message: response.message,
                        data: null
                    });
                }
                return res.status(response.status).json({
                    status: response.status,
                    message: response.message,
                    data: response.data
                });
            });
        } catch (error) {
            logger.error(error.message);
            return res.status(500).json({
                status: 500,
                message: getMessage('internal.server.error'),
                data: null
            });
        }
    },


    /**
     *  Run Workflow on E-Account & E-Cif
     * */
    runEAccountAndECifWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runEAccountAndECifWorkflow');
            await runEAccountAndECifWorkflow(id, body, (response) => {
                if (response.status === 400 || response.status === 204) {
                    return res.status(response.status).json({
                        status: response.status,
                        message: response.message,
                        data: null
                    });
                }
                return res.status(response.status).json({
                    status: response.status,
                    message: response.message,
                    data: response.data
                });
            });
        } catch (error) {
            logger.error(error.message);
            return res.status(500).json({
                status: 500,
                message: getMessage('internal.server.error'),
                data: null
            });
        }
    },

}