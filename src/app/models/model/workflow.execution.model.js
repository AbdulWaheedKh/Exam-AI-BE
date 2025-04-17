const mongoose = require('mongoose');

const workflowExecution = new mongoose.Schema({

    workflowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'workflows',
        required: false
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'acc_personal_infos',
        required: false
    },
    wfStatus: {
        type: String, required: false
    },
    workflow: {
        type: String, required: false
    },
    workflowType: {
        type: String, required: false
    },
    purpose: {
        type: String, required: false
    },
    currentLevel: {
        type: Number
    },
    currentGroup: {
        type: String, required: false
    },


}, {timestamps: true});

const WorkflowExecution = mongoose.model('workflow_executions', workflowExecution);

module.exports = WorkflowExecution;
