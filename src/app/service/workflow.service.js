const {getMessage} = require("../util/messages");
const GenericResponseDTO = require("../models/dto/generic.response.dto");
const axios = require('axios');
const AppConstants = require("../util/app.constants");
const mongoose = require("mongoose");
const logger = require("../logger");

const Workflow = require("../models/model/workflow.model");
const WorkflowGroup = require("../models/model/workflow.group.model");

module.exports = {

    /**
     * Search WF
     * */
    searchWorkflow: async (params, offset = 0, limit = 10, callBack) => {
        logger.info('WorkflowService:searchWorkflow method called..');

        try {
            const { code, description } = params;
            let query = {
                $and: []
            };
            if (code) query.$and.push({ code: code });
            if (description) query.$and.push({ description: description });

            if (query.$and.length === 0) {
                return callBack(new GenericResponseDTO(204, null, getMessage('record.not.found')));
            }

            const workflows = await Workflow.find(query).skip(offset).limit(limit).exec();
            const totalRecordsWorkflows = await Workflow.countDocuments(query);
            const totalRecords = totalRecordsWorkflows;
            const totalPages = Math.ceil(totalRecords / limit);
            const response = {
                data: workflows,
                totalPages,
                totalRecords,
                currentOffset: offset
            };

            if (!workflows || workflows.length === 0) {
                return callBack(new GenericResponseDTO(204, null, getMessage('record.not.found')));
            }
            return callBack(new GenericResponseDTO(200, response, getMessage('record.found')));
        } catch (error) {
            logger.error(`Error in Workflow: ${error.message}`);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },

    /**
     * Create WF
     * */
    createWorkflow: async (data, callBack) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info('WorkflowService:createWorkflow method called..');
        try {
            // check if WF already exist
            const existingWorkflow = await Workflow.findOne({
                // code: data.code,
                workflow: data.workflow,
                flowType: data.flowType,
                riskRating: data.riskRating,
                // channelId: data.channelId,
                channelId: data.channelId,
                purpose : data.purpose
            }).session(session);

            if (existingWorkflow) {
                await session.abortTransaction();
                session.endSession();
                return callBack(new GenericResponseDTO(409, null, getMessage('workflow.already.exist')));
            }

            const newWorkflow = new Workflow(data);
            const response = await newWorkflow.save({ session });

            // saving WF details
            if (Array.isArray(data.groupDetails)) {
                for (const groupDetail of data.groupDetails) {
                    groupDetail.workflowId = response._id;
                    const newWorkflowGroup = new WorkflowGroup(groupDetail);
                    await newWorkflowGroup.save({ session });
                }
            }

            await session.commitTransaction();
            session.endSession();
            return callBack(new GenericResponseDTO(200, response, getMessage('workflow.created')));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error: ${error}`);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },

    /**
     * get all WF's
     * */
    getWorkflows: async (offset = 0, limit = 10, callBack) => {
        logger.info('WorkflowService:getWorkflows method called..');
        try {
            let workflowsDataResponse = [];
            // Find workflows with pagination
            const workflowsData = await Workflow.find().skip(offset).limit(limit);
            // Get the total number of records for pagination info
            const totalRecords = await Workflow.countDocuments();
            // If workflows exist, process each workflow to find its associated workflow groups
            if (workflowsData && workflowsData.length > 0) {
                for (let workflow of workflowsData) {
                    const workflowGroups = await WorkflowGroup.find({ workflowId: workflow._id }) || null;
                    // Convert the workflow data to a plain object and add the group details
                    let workflowDataResponse = workflow.toObject();
                    workflowDataResponse.groupDetails = workflowGroups;
                    workflowsDataResponse.push(workflowDataResponse);
                }
            } else {
                // If no workflows are found, return a 204 response
                return callBack(new GenericResponseDTO(204, null, getMessage('no.data.found')));
            }
            // Create the response object with pagination info
            const response = {
                data: workflowsDataResponse,
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentOffset: offset,
            };
            // Return a 200 response with the populated workflows data
            return callBack(new GenericResponseDTO(200, response, getMessage('record.found')));
        } catch (error) {
            // Log the error and return a 500 response
            logger.error(`Error: ${error}`);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },

    /**
     * get WF
     * */
    getWorkflow: async (id, callBack) => {
        logger.info('WorkflowService:getWorkflow method called..');
        try {
            let workflowDataResponse = null;
            // Find the workflow by ID
            const workflowData = await Workflow.findById(id);
            // If the workflow exists, find the associated workflow groups
            if (workflowData) {
                const workflowGroups = await WorkflowGroup.find({ workflowId: workflowData._id }) || null;
                // Convert the workflow data to a plain object and add the group details
                workflowDataResponse = workflowData.toObject();
                workflowDataResponse.groupDetails = workflowGroups;
            }
            // If the workflow is not found, return a 404 response
            if (!workflowData) {
                return callBack(new GenericResponseDTO(404, null, getMessage('record.not.found')));
            }
            // Return a 200 response with the populated account data
            return callBack(new GenericResponseDTO(200, workflowDataResponse, getMessage('record.found')));
        } catch (error) {
            // Log the error and return a 500 response
            logger.error(`Error: ${error}`);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },

    /**
     * update WF
     * */
    updateWorkflow: async (id, body, callBack) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info('WorkflowService:updateWorkflow method called..');
        try {
            // Check if the workflow exists
            const existingWorkflow = await Workflow.findById(id).session(session);
            if (!existingWorkflow) {
                await session.abortTransaction();
                session.endSession();
                logger.info('workflow not found');
                return callBack(new GenericResponseDTO(404, null, getMessage('record.not.found')));
            }
            // Check if there are existing WorkflowGroup documents and delete them
            const wfExist = await WorkflowGroup.exists({ workflowId: existingWorkflow._id }).session(session);
            if (wfExist) {
                await WorkflowGroup.deleteMany({ workflowId: existingWorkflow._id }).session(session);
            }
            // Update the workflow with new data
            Object.assign(existingWorkflow, body);
            const workflowUpdate = await existingWorkflow.save({ session });

            // If groupDetails are provided, create new WorkflowGroup documents
            if (Array.isArray(body.groupDetails)) {
                for (const groupDetail of body.groupDetails) {
                    groupDetail.workflowId = existingWorkflow._id;
                    const newWorkflowGroup = new WorkflowGroup(groupDetail);
                    await newWorkflowGroup.save({ session });
                }
            }
            await session.commitTransaction();
            session.endSession();
            return callBack(new GenericResponseDTO(200, workflowUpdate, getMessage('workflow.updated')));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error: ${error}`);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },

    /**
     * delete WF
     * */
    deleteWorkflow: async (id, callBack) => {
        try {
            const workflow = await Workflow.findById(id);
            if (!workflow) {
                return callBack(new GenericResponseDTO(404, null, getMessage('record.not.found')));
            }
            const deletedWorkflow = await Workflow.findByIdAndDelete(id);

            if (deletedWorkflow) {
                return callBack(new GenericResponseDTO(200, null, getMessage('the.record.deleted.successfully')));
            } else {
                return callBack(new GenericResponseDTO(404, null, getMessage('record.not.found')));
            }
        } catch (error) {
            console.error('Error deleting workflow:', error);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },


}
