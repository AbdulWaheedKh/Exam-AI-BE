
const {
    searchWorkflow,
    createWorkflow,
    getWorkflows,
    getWorkflow,
    updateWorkflow,
    deleteWorkflow,

} = require("../service/workflow.service");
const logger = require('../logger');
const {getMessage} = require('../util/messages');
module.exports = {

    /**
     * Search WF
     * */
    searchWorkflow : async (req, res) => {
        try {
            const { code, description, offset = 0, limit = 10 } = req.query;

            const params = {
                code: code || '',
                description: description || ''
            };

            const limitValue = parseInt(limit, 10) || 10;
            const offsetValue = parseInt(offset, 10) || 0;
            await searchWorkflow(params, offsetValue, limitValue, (response) => {
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
     * Create WF
     * */
    createWorkflow: async (req, res) => {
        try {
            const body = req.body;
            logger.info('Calling Function: createWorkflow');
            await createWorkflow(body, (response) => {
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
     * get all WF's
     * */
    getWorkflows: async (req, res) => {
        try {
            logger.info('Calling Function: getWorkflows');
            const offset = parseInt(req.query.offset) || 0;
            const limit = parseInt(req.query.limit) || 10;

            await getWorkflows(offset, limit,(response) => {
                if (response.status === 204) {
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
     * get WF
     * */
    getWorkflow: async (req, res) => {
        try {
            logger.info('Calling Function: getWorkflow');
            const {id} = req.params;

            await getWorkflow(id, (response) => {
                if (response.status === 204) {
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
     * update WF
     * */
    updateWorkflow: async (req, res) => {
        try {
            const body = req.body;
            const {id} = req.params;
            logger.info('Calling Function: updateWorkflow');
            await updateWorkflow(id, body, (response) => {
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
     * delete WF
     * */
    deleteWorkflow: async (req, res) => {
        try {
            logger.info('Calling Function: deleteWorkflow');
            const id = req.params.id;
            await deleteWorkflow(id, (response) => {
                if (response.status === 204) {
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
