const mongoose = require('mongoose');
const {Double} = require("mongodb");

const workflowGroup = new mongoose.Schema({

    workflowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'workflows',
        required: true
    },
    approvedAssigneeGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups',
        required: false
    },
    revertedAssigneeGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups',
        required: false
    },
    email: {
        type: Boolean, default: false
    },
    scanning: {
        type: Boolean, default: false
    },
    level: {
        type: Number
    },
    initGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups',
        required: false
    },
    supervisoryGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups',
        required: false
    },
    operation: {
        type: String, required: false
    },
}, {timestamps: true});

const WorkflowGroup = mongoose.model('workflow_groups', workflowGroup);

module.exports = WorkflowGroup;

