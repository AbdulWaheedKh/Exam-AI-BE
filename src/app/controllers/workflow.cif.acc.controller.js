
const {
    runAccountWorkflow,runCifWorkflow,runDAOWorkflow,runRDAWorkflow,runCifAndAccountWorkflow,runCifMaintAndAccOpenWorkflow,
} = require("../service/workflow.cif.acc.service");
const logger = require('../logger');
const {getMessage} = require('../util/messages');
module.exports = {

    /**
     *  Run Workflow on Account
     * */
    runAccountWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runAccountWorkflow');
            await runAccountWorkflow(id, body, (response) => {
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
     *  Run Workflow on CIF
     * */
    runCifWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runCifWorkflow');
            await runCifWorkflow(id, body, (response) => {
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
     *  Run Workflow on DAO
     * */
    runDAOWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runDAOWorkflow');
            await runDAOWorkflow(id, body, (response) => {
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
     *  Run Workflow on RDA
     * */
    runRDAWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runDAOWorkflow');
            await runRDAWorkflow(id, body, (response) => {
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
     *  Run Workflow on Account & Cif
     * */
    runCifAndAccountWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runCifAndAccountWorkflow');
            await runCifAndAccountWorkflow(id, body, (response) => {
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
     *  CIF-Maintenance & Account-Opening Workflow
     * */
    runCifMaintAndAccOpenWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: runCifMaintAndAccOpenWorkflow');
            await runCifMaintAndAccOpenWorkflow(id, body, (response) => {
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
