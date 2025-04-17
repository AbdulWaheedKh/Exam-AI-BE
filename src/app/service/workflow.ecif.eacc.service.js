const {getMessage} = require("../util/messages");
const GenericResponseDTO = require("../models/dto/generic.response.dto");
const axios = require('axios');
const AppConstants = require("../util/app.constants");
const mongoose = require("mongoose");
const logger = require("../logger");

const Workflow = require("../models/model/workflow.model");
const WorkflowGroup = require("../models/model/workflow.group.model");
const {getWorkflow} = require("../service/workflow.service");
const WorkflowExecution = require("../models/model/workflow.execution.model");

module.exports = {

    /**
     * Run Workflow on E-CIF
     * */
    runECifWorkflow: async (id, body, callBack) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info('WorkflowECIF&EACCService:runECifWorkflow method called..');

        try {
            const {workflow, flowType, riskRating, channelId, status} = body;
            let currLevel = null;
            let workflowExecutionResponse = null;
            let workflowFinalStatus = null;
            let cifData;
            let wfStatusValue = null;
            let isEcifNoPermanent = false;

            if (!workflow || !flowType || !riskRating || !channelId) {
                return callBack(new GenericResponseDTO(404, null, getMessage('param.not.found')));
            }

            cifData = await fetchAccountCifData(id, workflow, session);
            if (!cifData) {
                logger.info('method : runECifWorkflow ...ecifData not found');
                return callBack(new GenericResponseDTO(404, null, getMessage('ecif.not.found')));
            }

            cifData = cifData.data.data.ecifCompanyInfo;
            purpose = cifData.isEcifNoPermanent === true ? 'MAINTENANCE' : 'ONBOARDING';

            if (!purpose) {
                logger.info('E-CIF : Purpose is undefined');
                return callBack(new GenericResponseDTO(404, null, getMessage('ecif.not.found')));
            }

            //find WF
            const foundWorkflow = await findWorkflow(workflow, flowType, riskRating, purpose, channelId, session, (callBack));
            if (foundWorkflow.status === 404) {
                return callBack(foundWorkflow);
            }
            //find WF Groups associated to WF
            const workflowGroups = await findWorkflowGroups(foundWorkflow._id, session);
            const workflowResponse = {...foundWorkflow.toObject(), groupDetails: workflowGroups};

            //check if WF executed already executed
            workflowExecutionResponse = await findWorkflowExecution(foundWorkflow._id, id, purpose, session);

            if (workflowExecutionResponse) {
                if (workflowExecutionResponse.currentLevel === 0) {
                    try {
                        await WorkflowExecution.findByIdAndDelete(workflowExecutionResponse._id);
                    } catch (error) {
                        console.error(`Error deleting workflow execution: ${error}`);
                    }
                }
            }

            //find current level and wfStatus
            ({
                wfStatusValue,
                currLevel
            } = await processWorkflowGroups(workflowResponse, cifData, status, workflowExecutionResponse, purpose, workflow));

            const updatedCifData = cifData;

            if (purpose === 'ONBOARDING' || purpose === 'MAINTENANCE') {
                await handleWorkflowExecution(
                    id, foundWorkflow, wfStatusValue, purpose, workflow, flowType, currLevel, session, updatedCifData, callBack
                );
            }

            const workflowExecutionFinalResponse = await findWorkflowExecution(foundWorkflow._id, id, purpose, session);

            // check if the workflow levels are equal to current level of workflow
            // send the data after wf final execution to CBS push api's
            // currently we dont have fields for eacc and ecif. below fields are dummy
            if (workflowExecutionFinalResponse && foundWorkflow) {
                if (workflowExecutionFinalResponse.currentLevel === foundWorkflow.level) {
                    workflowFinalStatus = "workflow executed";
                    isEcifNoPermanent = true;
                    await handlePayloadData(id, updatedCifData, workflow);
                }
            }
            if (purpose === 'ONBOARDING') {
                updatedCifData.workflowComplete = workflowFinalStatus;
                updatedCifData.wfStatus = wfStatusValue;
                updatedCifData.isEcifNoPermanent = isEcifNoPermanent;
                updatedCifData.pickedBy = null;
            }
            if (purpose === 'MAINTENANCE') {
                updatedCifData.wfStatusMaint = wfStatusValue;
                updatedCifData.pickedBy = null;
            }

            await updateAccountStatusAndPikedByStatus(id, updatedCifData, workflow);

            await session.commitTransaction();
            session.endSession();

            if (body.comments && body.comments.length > 0 || body.discrepancy && body.discrepancy.length > 0) {
                const methodBody = {
                    workflow, flowType, riskRating, channelId, status, purpose,
                    comments: body.comments,
                    discrepancy: body.discrepancy
                };
                const workflowApproveRevertCommentAndDiscrepancies = await axios.post(`${process.env.ACC_SERVICE_URL}${AppConstants.WF_COMMENT_AND_DISCREPANCY_ENDPOINT}${id}`, methodBody, {timeout: 10000});

                if (workflowApproveRevertCommentAndDiscrepancies.status === 200) {
                    console.log(" ---- Comments and Discrepancies added in E-CIF ---- ")
                    logger.info(" ---- Comments and Discrepancies added in E-CIF ---- ");
                }
            }
            const dataObj = {
                personalInfo: updatedCifData,
            };
            await logHistoryForUpdatedData(dataObj, purpose, workflow, riskRating, workflowResponse);

            return callBack(new GenericResponseDTO(200, updatedCifData, getMessage('workflow.updated')));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error: ${error}`);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },

    /**
     *  Run Workflow on E-Account
     * */
    runEAccountWorkflow: async (id, body, callBack) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info('WorkflowEAcc&ECifService:runEAccountWorkflow method called..');

        try {
            const {workflow, flowType, riskRating, channelId, status} = body;
            let currLevel = null;
            let workflowExecutionResponse = null;
            let workflowFinalStatus = null;
            let accountData;
            let wfStatusValue = null;
            let isEaccNoPermanent = false;

            if (!workflow || !flowType || !riskRating || !channelId) {
                return callBack(new GenericResponseDTO(404, null, getMessage('param.not.found')));
            }

            accountData = await fetchAccountCifData(id, workflow, session);
            if (!accountData) {
                logger.info('method : runEAccountWorkflow ...accountData not found');
                return callBack(new GenericResponseDTO(404, null, getMessage('eacc.not.found')));
            }
            accountData = accountData.data.data.eAccPersonalInfo;

            purpose = accountData.isEaccNoPermanent === true ? 'MAINTENANCE' : 'ONBOARDING';
            if (!purpose) {
                logger.info('E-Acc : Purpose is undefined');
                return callBack(new GenericResponseDTO(404, null, getMessage('eacc.not.found')));
            }

            const foundWorkflow = await findWorkflow(workflow, flowType, riskRating, purpose, channelId, session, (callBack));
            if (foundWorkflow.status === 404) {
                return callBack(foundWorkflow);
            }
            const workflowGroups = await findWorkflowGroups(foundWorkflow._id, session);
            const workflowResponse = {...foundWorkflow.toObject(), groupDetails: workflowGroups};

            workflowExecutionResponse = await findWorkflowExecution(foundWorkflow._id, id, purpose, session);

            if (workflowExecutionResponse) {
                if (workflowExecutionResponse.currentLevel === 0) {
                    try {
                        await WorkflowExecution.findByIdAndDelete(workflowExecutionResponse._id);
                    } catch (error) {
                        console.error(`Error deleting workflow execution: ${error}`);
                    }
                }
            }

            ({
                wfStatusValue,
                currLevel
            } = await processWorkflowGroups(workflowResponse, accountData, status, workflowExecutionResponse, purpose, workflow));

            const updatedAccData = accountData;

            if (purpose === 'ONBOARDING' || purpose === 'MAINTENANCE') {
                await handleWorkflowExecution(
                    id, foundWorkflow, wfStatusValue, purpose, workflow, flowType, currLevel, session, updatedAccData, callBack
                );
            }

            const workflowExecutionFinalResponse = await findWorkflowExecution(foundWorkflow._id, id, purpose, session);

            // check if the workflow levels are equal to current level of workflow
            // send the data after wf final execution to CBS push api's
            // currently we dont have fields for eacc and ecif. below fields are dummy
            if (workflowExecutionFinalResponse && foundWorkflow) {
                if (workflowExecutionFinalResponse.currentLevel === foundWorkflow.level) {
                    workflowFinalStatus = "workflow executed";
                    await handlePayloadData(id, updatedAccData, workflow);
                    isEaccNoPermanent = true;
                }
            }
            if (purpose === 'ONBOARDING') {

                updatedAccData.workflowComplete = workflowFinalStatus;
                updatedAccData.wfStatus = wfStatusValue;
                updatedAccData.isEaccNoPermanent = isEaccNoPermanent;
                updatedAccData.pickedBy = null;
            }
            if (purpose === 'MAINTENANCE') {
                updatedAccData.wfStatusMaint = wfStatusValue;
                updatedAccData.pickedBy = null;
            }

            await updateAccountStatusAndPikedByStatus(id, updatedAccData, workflow);

            await session.commitTransaction();
            session.endSession();

            if (body.comments && body.comments.length > 0 || body.discrepancy && body.discrepancy.length > 0) {
                const methodBody = {
                    workflow, flowType, riskRating, channelId, status, purpose,
                    comments: body.comments,
                    discrepancy: body.discrepancy
                };
                const workflowApproveRevertCommentAndDiscrepancies = await axios.post(`${process.env.ACC_SERVICE_URL}${AppConstants.WF_COMMENT_AND_DISCREPANCY_ENDPOINT}${id}`, methodBody, {timeout: 10000});

                if (workflowApproveRevertCommentAndDiscrepancies.status === 200) {
                    logger.info(" ---- Comments and Discrepancies added in E-ACCOUNT ---- ");
                }
            }
            const dataObj = {
                personalInfo: updatedAccData,
            };
            await logHistoryForUpdatedData(dataObj, purpose, workflow, riskRating, workflowResponse);

            return callBack(new GenericResponseDTO(200, updatedAccData, getMessage('workflow.updated')));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error: ${error}`);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },

    /**
     *  Run Workflow on E-Account & E-Cif
     * */
    runEAccountAndECifWorkflow: async (id, body, callBack) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info('WorkflowCif&AccService:runAccountWorkflow method called..');

        try {
            const {workflow, flowType, riskRating, channelId, status} = body;
            let currLevel = null;
            let workflowExecutionResponse = null;
            let workflowFinalStatus = null;
            let workflowId = null;
            let accountData;
            let wfStatusValue = null;
            let payload;  // for history
            let isEaccNoPermanent = false;
            let purpose;

            if (!workflow || !flowType || !riskRating || !channelId) {
                return callBack(new GenericResponseDTO(404, null, getMessage('param.not.found')));
            }

            accountData = await fetchAccountCifData(id, workflow, session);
            if (!accountData) {
                logger.info('method : runEAccountAndECifWorkflow ...accountData not found');
                return callBack(new GenericResponseDTO(404, null, getMessage('eacc.not.found')));
            }
            accountData = accountData.data.data.eAccPersonalInfo;
            purpose = accountData.isEaccNoPermanent === true ? 'MAINTENANCE' : 'ONBOARDING';

            if (!purpose) {
                logger.info('E-Acc : Purpose is undefined');
                return callBack(new GenericResponseDTO(404, null, getMessage('eacc.not.found')));
            }

            const foundWorkflow = await findWorkflow(workflow, flowType, riskRating, purpose, channelId, session, (callBack));
            if (foundWorkflow.status === 404) {
                return callBack(foundWorkflow);
            }
            const workflowGroups = await findWorkflowGroups(foundWorkflow._id, session);
            const workflowResponse = {...foundWorkflow.toObject(), groupDetails: workflowGroups};

            workflowExecutionResponse = await findWorkflowExecution(foundWorkflow._id, id, purpose, session);

            if (workflowExecutionResponse) {
                if (workflowExecutionResponse.currentLevel === 0) {
                    try {
                        await WorkflowExecution.findByIdAndDelete(workflowExecutionResponse._id);
                    } catch (error) {
                        console.error(`Error deleting workflow execution: ${error}`);
                    }
                }
            }

            ({
                wfStatusValue,
                currLevel
            } = await processWorkflowGroups(workflowResponse, accountData, status, workflowExecutionResponse, purpose, workflow));

            const updatedAccData = accountData;

            if (purpose === 'ONBOARDING' || purpose === 'MAINTENANCE') {
                await handleWorkflowExecution(
                    id, foundWorkflow, wfStatusValue, purpose, workflow, flowType, currLevel, session, updatedAccData, callBack
                );
            }
            const workflowExecutionFinalResponse = await findWorkflowExecution(foundWorkflow._id, id, purpose, session);

            // check if the workflow levels are equal to current level of workflow
            // send the data after wf final execution to CBS push api's
            if (workflowExecutionFinalResponse && foundWorkflow) {
                if (workflowExecutionFinalResponse.currentLevel === foundWorkflow.level) {
                    workflowFinalStatus = "workflow executed";
                    await handlePayloadData(id, updatedAccData, workflow);
                    isEaccNoPermanent = true;
                }
            }
            if (purpose === 'ONBOARDING') {

                updatedAccData.workflowComplete = workflowFinalStatus;
                updatedAccData.wfStatus = wfStatusValue;
                updatedAccData.isEaccNoPermanent = isEaccNoPermanent;
                updatedAccData.pickedBy = null;
            }
            if (purpose === 'MAINTENANCE') {
                updatedAccData.wfStatusMaint = wfStatusValue;
                updatedAccData.pickedBy = null;
            }
            await updateAccountStatusAndPikedByStatus(id, updatedAccData, workflow);

            await session.commitTransaction();
            session.endSession();

            if (body.comments && body.comments.length > 0 || body.discrepancy && body.discrepancy.length > 0) {
                const methodBody = {
                    workflow, flowType, riskRating, channelId, status, purpose,
                    comments: body.comments,
                    discrepancy: body.discrepancy
                };
                const workflowApproveRevertCommentAndDiscrepancies = await axios.post(`${process.env.ACC_SERVICE_URL}${AppConstants.WF_COMMENT_AND_DISCREPANCY_ENDPOINT}${id}`, methodBody, {timeout: 10000});

                if (workflowApproveRevertCommentAndDiscrepancies.status === 200) {
                    logger.info(" ---- Comments and Discrepancies added in E-CIF AND E-ACCOUNT---- ");
                }
            }

            const dataObj = {
                personalInfo: updatedAccData,
            };
            await logHistoryForUpdatedData(dataObj, purpose, workflow, riskRating, workflowResponse);

            return callBack(new GenericResponseDTO(200, updatedAccData, getMessage('workflow.updated')));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error: ${error}`);
            return callBack(new GenericResponseDTO(500, null, getMessage('internal.server.error')));
        }
    },

}
const fetchAccountCifData = async (id, workflow, session) => {
    try {
        if (workflow === "E_ACCOUNT") {
            return await axios.get(`${process.env.ACC_SERVICE_URL}${AppConstants.EACC_SERVICE_ENDPOINT}${id}`, {timeout: 10000});
        }
        if (workflow === "E_CIF") {
            return await axios.get(`${process.env.ACC_SERVICE_URL}${AppConstants.ECIF_SERVICE_ENDPOINT}${id}`, {timeout: 10000});
        }
        if (workflow === "E_CIF_AND_E_ACCOUNT") {
            return await axios.get(`${process.env.ACC_SERVICE_URL}${AppConstants.EACC_SERVICE_ENDPOINT}${id}`, {timeout: 10000});
        }
    } catch (axiosError) {
        logger.error('Error fetching data from API:', axiosError);
        throw new Error('Failed to fetch data from external service.');
    }
};
const findWorkflow = async (workflow, flowType, riskRating, purpose, channelId, callBack) => {
    try {
        const foundWorkflow = await Workflow.findOne({flowType, workflow, riskRating, purpose, channelId});
        if (!foundWorkflow) {
            return new GenericResponseDTO(404, null, getMessage('workflow.not.found'));
        }
        return foundWorkflow;
    } catch (dbError) {
        logger.error('Error querying Workflow:', dbError);
        return callBack(new GenericResponseDTO(404, null, getMessage('workflow.not.found')));
    }
};
const findWorkflowGroups = async (workflowId, session) => {
    try {
        return await WorkflowGroup.find({workflowId}).session(session);
    } catch (dbError) {
        logger.error('Error querying WorkflowGroup:', dbError);
        throw new Error('Error querying workflow groups.');
    }
};
const findWorkflowExecution = async (workflowId, documentId, purpose, session) => {
    try {
        return await WorkflowExecution.findOne({
            workflowId: workflowId,
            documentId: documentId,
            purpose: purpose
        }).session(session);

    } catch (dbError) {
        logger.error('Error querying WorkflowExecution:', dbError);
        throw new Error('Error querying workflow execution.');
    }

};

const processWorkflowGroups = async (workflowResponse, accountCifData, status, workflowExecutionResponse, purpose, workflow) => {
    let wfStatusValue = null;
    let currLevel = null;
    const processGroupDetails = async (groupDetails, wfStatusKey) => {
        for (const groupDetail of groupDetails) {
            let workflowCurrentLevel = accountCifData[wfStatusKey] ? workflowExecutionResponse.currentLevel + 1 : null;

            if (groupDetail.operation === AppConstants.WORKFLOW_OPERATION_SUBMIT && !accountCifData[wfStatusKey]) {
                const supervisoryGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.supervisoryGroupId}`, {timeout: 10000});
                // wfStatusValue = supervisoryGroup.data.data.name;
                wfStatusValue = `REQUEST_IS_AT_${supervisoryGroup.data.data.name}`;
                currLevel = groupDetail.level;
                break;
            }

            // if (!groupDetail.operation && groupDetail.approvedAssigneeGroupId && status === AppConstants.STATUS_APPROVED && workflowCurrentLevel === groupDetail.level) {
            //     const approvedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.approvedAssigneeGroupId}`, { timeout: 10000 });
            //     wfStatusValue = approvedGroup.data.data.name;
            //     currLevel = groupDetail.level;
            //     break;
            // }
            if (!groupDetail.operation && status === AppConstants.STATUS_APPROVED && workflowCurrentLevel === groupDetail.level) {
                // Check if approvedAssigneeGroupId is null or undefined
                if (!groupDetail.approvedAssigneeGroupId) {
                    // wfStatusValue = "CBS";
                    wfStatusValue = AppConstants.STATUS_ACTIVATED; // REQ_IS_AT_CBS.after discussion with sanwal bhai
                    currLevel = groupDetail.level;
                    break;
                } else {
                    try {
                        // Make the API call only if approvedAssigneeGroupId exists
                        const approvedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.approvedAssigneeGroupId}`, {timeout: 10000});
                        // wfStatusValue = approvedGroup.data.data.name;
                        wfStatusValue = `REQUEST_IS_AT_${approvedGroup.data.data.name}`;
                        currLevel = groupDetail.level;
                        break;
                    } catch (error) {
                        console.error("Error fetching approved group:", error);
                        // Handle the error accordingly (e.g., logging or fallback logic)
                    }
                }
            }

            if (groupDetail.revertedAssigneeGroupId && status === AppConstants.STATUS_REVERTED && workflowCurrentLevel === groupDetail.level) {
                const revertedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.revertedAssigneeGroupId}`, {timeout: 10000});
                const workflowId = workflowResponse._id;
                const revertedId = revertedGroup.data?.data?._id;

                if (workflowId && revertedId) {
                    let matchingGroups = await WorkflowGroup.findOne({
                        $or: [
                            {initGroupId: revertedId},
                            {approvedAssigneeGroupId: revertedId},
                            {supervisoryGroupId: revertedId}
                        ],
                        workflowId
                    }).exec();

                    // if (matchingGroups) {
                    //     if (matchingGroups.initGroupId) {
                    //         currLevel = 0;
                    //         wfStatusValue = null;
                    //     } else {
                    //         currLevel = matchingGroups.level;
                    //         wfStatusValue = revertedGroup.data.data.name;
                    //     }
                    // }

                    if (matchingGroups) {
                        if (matchingGroups.initGroupId && revertedId === matchingGroups.initGroupId.toString()) {
                            currLevel = 0;
                            wfStatusValue = null;
                        } else if (matchingGroups.initGroupId && revertedId === matchingGroups.supervisoryGroupId.toString()) {
                            currLevel = matchingGroups.level;
                            // wfStatusValue = revertedGroup.data.data.name;
                            wfStatusValue = `REQUEST_IS_AT_${revertedGroup.data.data.name}`;
                        } else {
                            currLevel = matchingGroups.level;
                            // wfStatusValue = revertedGroup.data.data.name;
                            wfStatusValue = `REQUEST_IS_AT_${revertedGroup.data.data.name}`;
                        }
                    }
                }
                break;
            }
        }
    };

    switch (purpose) {
        case 'ONBOARDING':
            switch (workflow) {
                case 'E_ACCOUNT':
                case 'E_CIF':
                case 'E_CIF_AND_E_ACCOUNT':
                    await processGroupDetails(workflowResponse.groupDetails, 'wfStatus');
                    break;
            }
            break;
        case 'MAINTENANCE':
            switch (workflow) {
                case 'E_ACCOUNT':
                case 'E_CIF':
                case 'E_CIF_AND_E_ACCOUNT':
                    await processGroupDetails(workflowResponse.groupDetails, 'wfStatusMaint');
                    break;
            }
            break;
    }

    // return or process wfStatusValue and currLevel as needed
    return {wfStatusValue, currLevel};
};

const handleWorkflowExecution = async (id, foundWorkflow, wfStatusValue, purpose, workflow, flowType, currLevel, session, updatedCifData, callBack) => {
    const wfStatusField = purpose === 'ONBOARDING' ? 'wfStatus' : 'wfStatusMaint';

    if (!updatedCifData[wfStatusField]) {
        const workflowExecution = new WorkflowExecution({
            documentId: id,
            workflowId: foundWorkflow._id,
            wfStatus: wfStatusValue,
            purpose: purpose,
            workflow: workflow,
            workflowType: flowType,
            currentLevel: currLevel
        });

        await workflowExecution.save({session});
    } else {
        const updateResult = await WorkflowExecution.findOneAndUpdate(
            {documentId: id, workflowId: foundWorkflow._id, purpose: purpose},
            {wfStatus: wfStatusValue, currentLevel: currLevel},
            {new: true, session: session}
        );

        if (!updateResult) {
            await session.abortTransaction();
            session.endSession();
            return callBack(new GenericResponseDTO(500, null, getMessage('failed.to.update.workflow.execution')));
        }
    }
};
const handlePayloadData = async (id, updatedAccData, workflow) => {
    if (workflow === 'E_ACCOUNT') {
        const payloadData = {
            "IZNAF01": {
                "F01BY": "@15074201A",
                "F01DT1": 1230921,
                "RQTM": 111229,
                "DTAST": "A",
                "CRLST": "",
                "F01TYP": "2",
                "F01BRN": "0786",
                "F01MAK": "L001",
                "F01DT": 1230921,
                "F01TM": 112440,
                "F01CHK": "L006",
                "F01DTC": 1230921,
                "F01TMC": 112509,
                "F01CHK1": "L031",
                "F01DTC1": 1230921,
                "F01TMC1": 115024,
                "F01CHK2": "L036",
                "F01DTC2": 1230921,
                "F01TMC2": 115032,
                "F01STA": "",
                "F01STAD": "",
                "ANCF01": "CJV05C",
                "ANCF02": "EA",
                "ANCF03": "A A",
                "ANCF04": "A",
                "ANCF05": "PK",
                "ANCF06": "PK",
                "ANCF07": "00D",
                "ANCFL1": "",
                "ANCFL2": "",
                "ANCFST": "",
                "CAAF00": "H",
                "CAAF01": "1",
                "CAAR01F": "A",
                "CAAR02F": "A",
                "CAAR03F": "A",
                "CAAR04F": "",
                "CAAR05F": "PK",
                "CAAR06F": "0021",
                "CAAR07F": "",
                "CAAP01F": "A",
                "CAAP02F": "A",
                "CAAP03F": "A",
                "CAAP04F": "",
                "CAAP05F": "PK",
                "CAAP06F": "0021",
                "CAAP07F": "",
                "CAAO01F": "A",
                "CAAO02F": "A",
                "CAAO03F": "A",
                "CAAO04F": "",
                "CAAO05F": "PK",
                "CAAO06F": "0021",
                "CAAO07F": "",
                "CAAO08F": "H",
                "CAAO09F": "",
                "CAAO10F": "03478545556",
                "CAAO11F": "",
                "CAAO12F": "",
                "CAAO13F": "0092",
                "CAAFST": "",
                "MCOF01": "0",
                "MCOF02": "S30",
                "MCOF03": "CA",
                "MCOF04": "N",
                "MCOF05": "",
                "MCOFST": "",
                "INDVF06": "2563325566666",
                "FCUSTP": "A1",
                "FCUOTP": "",
                "FNTBUS": "",
                "FOTBUS": "",
                "FEXINC": 1,
                "FEXCRT": 1,
                "FNOOFC": 1,
                "FEXDBT": 1,
                "FNOOFD": 1,
                "FSRCIN": "01",
                "FOTHINC": "",
                "FSRCWL": "06",
                "FOSRIN": "A",
                "FCRTRN": "06",
                "FOTTRN": "",
                "FTIT": "1",
                "FRISK": "L"
            },
            "IZNAF36": {
                "F36BY": "@15074201A",
                "OFJ108": "N",
                "OFJ109": "N",
                "OFJ110": "N",
                "OFJ111": "N",
                "OFJ114": "N",
                "OFJ115": "",
                "OFJ119": "",
                "OFJ208": "N",
                "OFJ209": "N",
                "OFJ210": "N",
                "OFJ211": "N",
                "OFJ214": "N",
                "OFJ215": "",
                "OFJ219": "",
                "OFJ308": "N",
                "OFJ309": "N",
                "OFJ310": "N",
                "OFJ311": "N",
                "OFJ314": "N",
                "OFJ315": "",
                "OFJ319": "",
                "CAAB04F36": "",
                "CAAT04F36": "",
                "CAAM04F36": "",
                "F36MTCMT1": "",
                "F36MTCMT2": "",
                "F36MTCMT3": "",
                "CUSRATF36": "L",
                "CUSWHTF36": 20,
                "CUSWHAL36": 0,
                "F36PURCIF": "02",
                "F36ADDTYP": "01",
                "F36FL1": "",
                "F36FL2": "N N",
                "F36FL3": "A",
                "F36FL4": " NNNN N",
                "F36FL5": "N0302",
                "F36FL6": "",
                "F36FL7": " 1",
                "F36FL8": "",
                "F36FL9": "",
                "F36S13": "A A",
                "F36VED": 0
            }
        }
        //call to dummy cbs api and returning the data from spark. as per direction from Irfan sb. replace later
        const cbsAccount = await axios.post(`${process.env.EXCHANGE_SERVICE_URL}${AppConstants.EXCHANGE_SERVICE_PUSH_ACC_CBS_ENDPOINT}`, payloadData, {timeout: 10000});
        if (cbsAccount.status !== 200) throw new Error('Data not found in CBS');
    }
    if (workflow === 'E_CIF') {
        const payloadData = {
            "IZNAF01": {
                "F01BY": "@10054815C",
                "F01DT1": 1211026,
                "RQTM": 52452,
                "DTAST": "A",
                "CRLST": "",
                "F01TYP": "1",
                "F01BRN": "0786",
                "F01MAK": "L001",
                "F01DT": 1211026,
                "F01TM": 53044,
                "F01CHK": "L006",
                "F01DTC": 1211026,
                "F01TMC": 54141,
                "F01CHK1": "L031",
                "F01DTC1": 1211026,
                "F01TMC1": 63004,
                "F01CHK2": "L036",
                "F01DTC2": 1211026,
                "F01TMC2": 82629,
                "F01STA": "",
                "F01STAD": "",
                "ANCF01": "CI2817",
                "ANCF02": "EA",
                "ANCF03": "AHSAN SHAH",
                "ANCF04": "AHSAN",
                "ANCF05": "PK",
                "ANCF06": "PK",
                "ANCF07": "00D",
                "ANCFL1": "",
                "ANCFL2": "",
                "ANCFST": "",
                "CAAF00": "H",
                "CAAF01": "4",
                "CAAR01F": "SS",
                "CAAR02F": "SDS",
                "CAAR03F": "DD",
                "CAAR04F": "",
                "CAAR05F": "PK",
                "CAAR06F": "0065",
                "CAAR07F": "",
                "CAAP01F": "SS",
                "CAAP02F": "SDS",
                "CAAP03F": "DD",
                "CAAP04F": "",
                "CAAP05F": "PK",
                "CAAP06F": "0065",
                "CAAP07F": "",
                "CAAO01F": "TOWER",
                "CAAO02F": "II CHUNDRIGAR",
                "CAAO03F": "MM ALM RD",
                "CAAO04F": "",
                "CAAO05F": "PK",
                "CAAO06F": "0065",
                "CAAO07F": "",
                "CAAO08F": "H",
                "CAAO09F": "",
                "CAAO10F": "03333333333",
                "CAAO11F": "",
                "CAAO12F": "",
                "CAAO13F": "0092",
                "CAAFST": "",
                "MCOF01": "",
                "MCOF02": "S30",
                "MCOF03": "CA",
                "MCOF04": "N",
                "MCOF05": "",
                "MCOFST": "",
                "INDVF06": "4220133333333",
                "FCUSTP": "A1",
                "FCUOTP": "",
                "FNTBUS": "",
                "FOTBUS": "",
                "FEXINC": 47000,
                "FEXCRT": 120,
                "FNOOFC": 3,
                "FEXDBT": 111,
                "FNOOFD": 7,
                "FSRCIN": "01",
                "FOTHINC": "",
                "FSRCWL": "06",
                "FOSRIN": "",
                "FCRTRN": "06",
                "FOTTRN": "",
                "FTIT": "4",
                "FRISK": "H"
            },
            "IZNAF18": {
                "BF18BY": "@10054815C",
                "BF01": "",
                "BF02": "",
                "BF03": "",
                "BF04": "",
                "BF05": "",
                "BF06": "",
                "BF07": "",
                "BF08": "",
                "BF09": "",
                "BF10": "",
                "BF11": "",
                "BF12": "",
                "BF13": "N",
                "BF14": "",
                "BF141": "N",
                "BF142": "N",
                "BF143": "",
                "BF144": "",
                "BF15": "",
                "BF16": "",
                "BF17": "",
                "BF18": "",
                "BF19": "",
                "BF20": "",
                "BF21": "",
                "BF22": "",
                "BF23": ""
            },
            "IZNAF04": {
                "F04BY": "@10054815C",
                "FA01": "N",
                "FA02": "N",
                "FA03": "",
                "FA04": "",
                "FA05": "",
                "FA06": "",
                "FA07": "",
                "FA08": "",
                "FA09": "N",
                "FA09A": "N",
                "FA10": "",
                "FA11": "N",
                "FA12": "N",
                "FA13": "",
                "FA14": "",
                "FA15": "",
                "FA16": "",
                "FA17": "",
                "FA18": "",
                "FA19": "",
                "FA20": "",
                "FA21": "",
                "FA22": "",
                "FA23": "",
                "FA24": "",
                "FA25": "26102021",
                "FA26": "",
                "FA27": "",
                "FA28": "",
                "FA29": "0065",
                "FA30": "26102021",
                "F01FLD1": "",
                "F01FLD2": "",
                "F01FLD3": ""
            }
        }
        //call to dummy cbs api and returning the data from spark. as per direction from Irfan sb. replace later
        const cbsCif = await axios.post(`${process.env.EXCHANGE_SERVICE_URL}${AppConstants.EXCHANGE_SERVICE_PUSH_CIF_CBS_ENDPOINT}`, payloadData, {timeout: 10000});
        if (cbsCif.status !== 200) throw new Error('Data not found in CBS');
    }
};
const updateAccountStatusAndPikedByStatus = async (id, updatedAccData, workflow) => {
    try {
        if (workflow === 'E_ACCOUNT') {
            // Update the account status
            const response = await axios.put(`${process.env.ACC_SERVICE_URL}${AppConstants.EACC_SERVICE_UPDATE_WF_STATUS_ENDPOINT}${id}`, updatedAccData, {timeout: 10000});
            if (response.status !== 200) {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        }
        if (workflow === 'E_CIF') {
            // Update the account status
            const response = await axios.put(`${process.env.ACC_SERVICE_URL}${AppConstants.ECIF_SERVICE_UPDATE_WF_STATUS_ENDPOINT}${id}`, updatedAccData, {timeout: 10000});

            if (response.status !== 200) {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        }
        if (workflow === 'E_CIF_AND_E_ACCOUNT') {
            // Update the account status
            const response = await axios.put(`${process.env.ACC_SERVICE_URL}${AppConstants.EACC_SERVICE_UPDATE_WF_STATUS_ENDPOINT}${id}`, updatedAccData, {timeout: 10000});
            if (response.status !== 200) {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        }
    } catch (error) {
        logger.error('Error updating account status:', error);
    }
};
const logHistory = async (updatedAccData, purpose, workflow) => {
    const payload = {
        entityObj: {...updatedAccData, purpose, workflow},
        type: "workflow-execution",
        operation: AppConstants.HISTORY_OPERATIONS.CREATED,
        userId: 1
    };

    try {
        const response = await axios.post(process.env.HISTORY_SERVICE_URL, payload, {timeout: 10000});
        if (response.status !== 200) {
            throw new Error(`Unexpected status code: ${response.status}`);
        }
    } catch (error) {
        logger.error('Error logging history:', error);
        throw new Error('Failed to log history.');
    }
};
const logHistoryForUpdatedData = async (updatedAccData, purpose, workflow, riskRating, workflowResponse) => {
    const payload = {
        entityObj: {...updatedAccData, purpose, workflow, riskRating, workflowResponse},
        type: workflow,
        operation: AppConstants.HISTORY_OPERATIONS.MODIFIED,
        userId: 1
    };

    try {
        const response = await axios.post(process.env.HISTORY_SERVICE_URL, payload, {timeout: 10000});
        if (response.status !== 200) {
            throw new Error(`Unexpected status code: ${response.status}`);
        }
    } catch (error) {
        logger.error('Error logging history:', error);
        throw new Error('Failed to log history.');
    }
};

// const processWorkflowGroups = async (workflowResponse, accountCifData, status, workflowExecutionResponse, purpose, workflow) => {
//     let wfStatusValue = null;
//     let currLevel = null;
//     if (purpose === 'ONBOARDING' && workflow === 'E_ACCOUNT') {
//         for (const groupDetail of workflowResponse.groupDetails) {
//             if (groupDetail.operation === AppConstants.WORKFLOW_OPERATION_SUBMIT && !accountCifData.wfStatus) {
//                 const supervisoryGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.supervisoryGroupId}`, {timeout: 10000});
//                 wfStatusValue = supervisoryGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             let workflowCurrentLevel = null;
//             if (accountCifData.wfStatus) {
//                 workflowCurrentLevel = workflowExecutionResponse.currentLevel + 1;
//             }
//             if (!groupDetail.operation && groupDetail.approvedAssigneeGroupId && status === AppConstants.STATUS_APPROVED && workflowCurrentLevel === groupDetail.level) {
//                 const approvedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.approvedAssigneeGroupId}`, {timeout: 10000});
//                 wfStatusValue = approvedGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             if (groupDetail.revertedAssigneeGroupId && status === AppConstants.STATUS_REVERTED && workflowExecutionResponse.currentLevel === groupDetail.level) {
//                 const revertedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.revertedAssigneeGroupId}`, {timeout: 10000});
//
//                 // Find the matching groupDetail based on the reverted group's ID
//                 const workflowId = workflowResponse._id; // replace with the actual workflowId value
//                 const revertedId = revertedGroup.data?.data?._id; // replace with the actual revertedId value
//                 let matchingGroups;
//                 if (workflowId && revertedId) {
//                     matchingGroups = await WorkflowGroup.findOne({
//                         $and: [
//                             {workflowId: workflowId},
//                             {initGroupId: revertedId}
//                         ]
//                     }).exec();
//                     // If no results from the first query, perform the second query
//                     // also must not equal to current group level : group leve dynamic and set the current level
//                     // if its reverted to init group then set the status to draft in case of onboarding
//                     // if again submit then should have operation submit with it.
//                     if (!matchingGroups) {
//                         matchingGroups = await WorkflowGroup.findOne({
//                             $and: [
//                                 {workflowId: workflowId},
//                                 {approvedAssigneeGroupId: revertedId}
//                             ]
//                         }).exec();
//                     }
//                     // Print the result to the console
//                     // console.log('Matching Groups:', matchingGroups);
//                 }
//                 if (matchingGroups) {
//                     if (matchingGroups.initGroupId) {
//                         currLevel = 0;
//                         wfStatusValue = null
//                     } else {
//                         currLevel = matchingGroups.level;
//                         wfStatusValue = revertedGroup.data.data.name;
//                     }
//                 }
//                 // wfStatusValue = revertedGroup.data.data.name;
//                 // currLevel = groupDetail.level;
//
//                 break;
//             }
//         }
//     }
//     if (purpose === 'MAINTENANCE' && workflow === 'E_ACCOUNT') {
//         for (const groupDetail of workflowResponse.groupDetails) {
//
//             if (groupDetail.operation === AppConstants.WORKFLOW_OPERATION_SUBMIT && !accountCifData.wfStatusMaint) {
//                 const supervisoryGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.supervisoryGroupId}`, {timeout: 10000});
//                 wfStatusValue = supervisoryGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             let workflowCurrentLevel = null;
//
//             if (accountCifData.wfStatusMaint) {
//                 workflowCurrentLevel = workflowExecutionResponse.currentLevel + 1;
//             }
//
//             if (!groupDetail.operation && groupDetail.approvedAssigneeGroupId && status === AppConstants.STATUS_APPROVED && workflowCurrentLevel === groupDetail.level) {
//                 const approvedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.approvedAssigneeGroupId}`, {timeout: 10000});
//                 wfStatusValue = approvedGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//
//             if (groupDetail.revertedAssigneeGroupId && status === AppConstants.STATUS_REVERTED && workflowExecutionResponse.currentLevel === groupDetail.level) {
//                 const revertedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.revertedAssigneeGroupId}`, {timeout: 10000});
//
//                 // Find the matching groupDetail based on the reverted group's ID
//                 const workflowId = workflowResponse._id; // replace with the actual workflowId value
//                 const revertedId = revertedGroup.data?.data?._id; // replace with the actual revertedId value
//                 let matchingGroups;
//                 if (workflowId && revertedId) {
//                     matchingGroups = await WorkflowGroup.findOne({
//                         $and: [
//                             {workflowId: workflowId},
//                             {initGroupId: revertedId}
//                         ]
//                     }).exec();
//                     // If no results from the first query, perform the second query
//                     // also must not equal to current group level : group leve dynamic and set the current level
//                     // if its reverted to init group then set the status to draft in case of onboarding
//                     // if again submit then should have operation submit with it.
//                     if (!matchingGroups) {
//                         matchingGroups = await WorkflowGroup.findOne({
//                             $and: [
//                                 {workflowId: workflowId},
//                                 {approvedAssigneeGroupId: revertedId}
//                             ]
//                         }).exec();
//                     }
//                     // Print the result to the console
//                     // console.log('Matching Groups:', matchingGroups);
//                 }
//                 if (matchingGroups) {
//                     if (matchingGroups.initGroupId) {
//                         currLevel = 0;
//                         wfStatusValue = null
//                     } else {
//                         currLevel = matchingGroups.level;
//                         wfStatusValue = revertedGroup.data.data.name;
//                     }
//                 }
//                 // wfStatusValue = revertedGroup.data.data.name;
//                 // currLevel = groupDetail.level;
//
//                 break;
//             }
//         }
//     }
//     if (purpose === 'ONBOARDING' && workflow === 'E_CIF') {
//         for (const groupDetail of workflowResponse.groupDetails) {
//             if (groupDetail.operation === AppConstants.WORKFLOW_OPERATION_SUBMIT && !accountCifData.wfStatus) {
//                 const supervisoryGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.supervisoryGroupId}`, {timeout: 10000});
//                 wfStatusValue = supervisoryGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             let workflowCurrentLevel = null;
//             if (accountCifData.wfStatus) {
//                 workflowCurrentLevel = workflowExecutionResponse.currentLevel + 1;
//             }
//             if (!groupDetail.operation && groupDetail.approvedAssigneeGroupId && status === AppConstants.STATUS_APPROVED && workflowCurrentLevel === groupDetail.level) {
//                 const approvedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.approvedAssigneeGroupId}`, {timeout: 10000});
//                 wfStatusValue = approvedGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             if (groupDetail.revertedAssigneeGroupId && status === AppConstants.STATUS_REVERTED && workflowCurrentLevel === groupDetail.level) {
//                 const revertedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.revertedAssigneeGroupId}`, {timeout: 10000});
//
//                 // Find the matching groupDetail based on the reverted group's ID
//                 const workflowId = workflowResponse._id; // replace with the actual workflowId value
//                 const revertedId = revertedGroup.data?.data?._id; // replace with the actual revertedId value
//                 let matchingGroups;
//                 if (workflowId && revertedId) {
//                     matchingGroups = await WorkflowGroup.findOne({
//                         $and: [
//                             {workflowId: workflowId},
//                             {initGroupId: revertedId}
//                         ]
//                     }).exec();
//                     // If no results from the first query, perform the second query
//                     // also must not equal to current group level : group leve dynamic and set the current level
//                     // if its reverted to init group then set the status to draft in case of onboarding
//                     // if again submit then should have operation submit with it.
//                     if (!matchingGroups) {
//                         matchingGroups = await WorkflowGroup.findOne({
//                             $and: [
//                                 {workflowId: workflowId},
//                                 {approvedAssigneeGroupId: revertedId}
//                             ]
//                         }).exec();
//                     }
//                     // Print the result to the console
//                     // console.log('Matching Groups:', matchingGroups);
//                 }
//                 if (matchingGroups) {
//                     if (matchingGroups.initGroupId) {
//                         currLevel = 0;
//                         wfStatusValue = null
//                     } else {
//                         currLevel = matchingGroups.level;
//                         wfStatusValue = revertedGroup.data.data.name;
//                     }
//                 }
//                 // wfStatusValue = revertedGroup.data.data.name;
//                 // currLevel = groupDetail.level;
//                 break;
//             }
//         }
//     }
//     if (purpose === 'MAINTENANCE' && workflow === 'E_CIF') {
//
//         for (const groupDetail of workflowResponse.groupDetails) {
//             if (groupDetail.operation === AppConstants.WORKFLOW_OPERATION_SUBMIT && !accountCifData.wfStatusMaint) {
//                 const supervisoryGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.supervisoryGroupId}`, {timeout: 10000});
//                 wfStatusValue = supervisoryGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             let workflowCurrentLevel = null;
//             if (accountCifData.wfStatusMaint) {
//                 workflowCurrentLevel = workflowExecutionResponse.currentLevel + 1;
//             }
//             if (!groupDetail.operation && groupDetail.approvedAssigneeGroupId && status === AppConstants.STATUS_APPROVED && workflowCurrentLevel === groupDetail.level) {
//                 const approvedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.approvedAssigneeGroupId}`, {timeout: 10000});
//                 wfStatusValue = approvedGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             if (groupDetail.revertedAssigneeGroupId && status === AppConstants.STATUS_REVERTED && workflowExecutionResponse.currentLevel === groupDetail.level) {
//                 const revertedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.revertedAssigneeGroupId}`, {timeout: 10000});
//
//                 // Find the matching groupDetail based on the reverted group's ID
//                 const workflowId = workflowResponse._id; // replace with the actual workflowId value
//                 const revertedId = revertedGroup.data?.data?._id; // replace with the actual revertedId value
//                 let matchingGroups;
//                 if (workflowId && revertedId) {
//                     matchingGroups = await WorkflowGroup.findOne({
//                         $and: [
//                             {workflowId: workflowId},
//                             {initGroupId: revertedId}
//                         ]
//                     }).exec();
//                     // If no results from the first query, perform the second query
//                     // also must not equal to current group level : group leve dynamic and set the current level
//                     // if its reverted to init group then set the status to draft in case of onboarding
//                     // if again submit then should have operation submit with it.
//                     if (!matchingGroups) {
//                         matchingGroups = await WorkflowGroup.findOne({
//                             $and: [
//                                 {workflowId: workflowId},
//                                 {approvedAssigneeGroupId: revertedId}
//                             ]
//                         }).exec();
//                     }
//                     // Print the result to the console
//                     // console.log('Matching Groups:', matchingGroups);
//                 }
//                 if (matchingGroups) {
//                     if (matchingGroups.initGroupId) {
//                         currLevel = 0;
//                         wfStatusValue = null
//                     } else {
//                         currLevel = matchingGroups.level;
//                         wfStatusValue = revertedGroup.data.data.name;
//                     }
//                 }
//                 // wfStatusValue = revertedGroup.data.data.name;
//                 // currLevel = groupDetail.level;
//
//                 break;
//             }
//         }
//     }
//     if (purpose === 'ONBOARDING' && workflow === 'E_CIF_AND_E_ACCOUNT') {
//         for (const groupDetail of workflowResponse.groupDetails) {
//             if (groupDetail.operation === AppConstants.WORKFLOW_OPERATION_SUBMIT && !accountCifData.wfStatus) {
//                 const supervisoryGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.supervisoryGroupId}`, {timeout: 10000});
//                 wfStatusValue = supervisoryGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             let workflowCurrentLevel = null;
//             if (accountCifData.wfStatus) {
//                 workflowCurrentLevel = workflowExecutionResponse.currentLevel + 1;
//             }
//             if (!groupDetail.operation && groupDetail.approvedAssigneeGroupId && status === AppConstants.STATUS_APPROVED && workflowCurrentLevel === groupDetail.level) {
//                 const approvedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.approvedAssigneeGroupId}`, {timeout: 10000});
//                 wfStatusValue = approvedGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             if (groupDetail.revertedAssigneeGroupId && status === AppConstants.STATUS_REVERTED && workflowCurrentLevel === groupDetail.level) {
//                 const revertedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.revertedAssigneeGroupId}`, {timeout: 10000});
//
//                 // Find the matching groupDetail based on the reverted group's ID
//                 const workflowId = workflowResponse._id; // replace with the actual workflowId value
//                 const revertedId = revertedGroup.data?.data?._id; // replace with the actual revertedId value
//                 let matchingGroups;
//                 if (workflowId && revertedId) {
//                     matchingGroups = await WorkflowGroup.findOne({
//                         $and: [
//                             {workflowId: workflowId},
//                             {initGroupId: revertedId}
//                         ]
//                     }).exec();
//                     // If no results from the first query, perform the second query
//                     // also must not equal to current group level : group leve dynamic and set the current level
//                     // if its reverted to init group then set the status to draft in case of onboarding
//                     // if again submit then should have operation submit with it.
//                     if (!matchingGroups) {
//                         matchingGroups = await WorkflowGroup.findOne({
//                             $and: [
//                                 {workflowId: workflowId},
//                                 {approvedAssigneeGroupId: revertedId}
//                             ]
//                         }).exec();
//                     }
//                     // Print the result to the console
//                     // console.log('Matching Groups:', matchingGroups);
//                 }
//                 if (matchingGroups) {
//                     if (matchingGroups.initGroupId) {
//                         currLevel = 0;
//                         wfStatusValue = null
//                     } else {
//                         currLevel = matchingGroups.level;
//                         wfStatusValue = revertedGroup.data.data.name;
//                     }
//                 }
//                 // wfStatusValue = revertedGroup.data.data.name;
//                 // currLevel = groupDetail.level;
//                 break;
//             }
//         }
//     }
//     if (purpose === 'MAINTENANCE' && workflow === 'E_CIF_AND_E_ACCOUNT') {
//
//         for (const groupDetail of workflowResponse.groupDetails) {
//             if (groupDetail.operation === AppConstants.WORKFLOW_OPERATION_SUBMIT && !accountCifData.wfStatusMaint) {
//                 const supervisoryGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.supervisoryGroupId}`, {timeout: 10000});
//                 wfStatusValue = supervisoryGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             let workflowCurrentLevel = null;
//             if (accountCifData.wfStatusMaint) {
//                 workflowCurrentLevel = workflowExecutionResponse.currentLevel + 1;
//             }
//             if (!groupDetail.operation && groupDetail.approvedAssigneeGroupId && status === AppConstants.STATUS_APPROVED && workflowCurrentLevel === groupDetail.level) {
//                 const approvedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.approvedAssigneeGroupId}`, {timeout: 10000});
//                 wfStatusValue = approvedGroup.data.data.name;
//                 currLevel = groupDetail.level;
//                 break;
//             }
//             if (groupDetail.revertedAssigneeGroupId && status === AppConstants.STATUS_REVERTED && workflowExecutionResponse.currentLevel === groupDetail.level) {
//                 const revertedGroup = await axios.get(`${process.env.UM_SERVICE_URL}${AppConstants.UM_SERVICE_GROUP_ENDPOINT}${groupDetail.revertedAssigneeGroupId}`, {timeout: 10000});
//
//                 // Find the matching groupDetail based on the reverted group's ID
//                 const workflowId = workflowResponse._id; // replace with the actual workflowId value
//                 const revertedId = revertedGroup.data?.data?._id; // replace with the actual revertedId value
//                 let matchingGroups;
//                 if (workflowId && revertedId) {
//                     matchingGroups = await WorkflowGroup.findOne({
//                         $and: [
//                             {workflowId: workflowId},
//                             {initGroupId: revertedId}
//                         ]
//                     }).exec();
//                     // If no results from the first query, perform the second query
//                     // also must not equal to current group level : group leve dynamic and set the current level
//                     // if its reverted to init group then set the status to draft in case of onboarding
//                     // if again submit then should have operation submit with it.
//                     if (!matchingGroups) {
//                         matchingGroups = await WorkflowGroup.findOne({
//                             $and: [
//                                 {workflowId: workflowId},
//                                 {approvedAssigneeGroupId: revertedId}
//                             ]
//                         }).exec();
//                     }
//                     // Print the result to the console
//                     // console.log('Matching Groups:', matchingGroups);
//                 }
//                 if (matchingGroups) {
//                     if (matchingGroups.initGroupId) {
//                         currLevel = 0;
//                         wfStatusValue = null
//                     } else {
//                         currLevel = matchingGroups.level;
//                         wfStatusValue = revertedGroup.data.data.name;
//                     }
//                 }
//                 // wfStatusValue = revertedGroup.data.data.name;
//                 // currLevel = groupDetail.level;
//
//                 break;
//             }
//         }
//     }
//     return {wfStatusValue, currLevel};
// };


