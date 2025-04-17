const mongoose = require('mongoose');

const workflow = new mongoose.Schema({

    code: {
        type: String, required: false
    },

    description: {
        type: String, required: false
    },


    flowType: {
        type: String, required: false
    },

    workflow: {
        type: String, required: false
    },

    purpose: {
        type: String, required: false
    },

    riskRating: {
        type: String, required: false
    },

    channelId: {
        type: String
    },
    level: {
        type: Number, required: false
    },
    createdBy: {
        type: String, required: false
    },
    updatedBy: {
        type: String, required: false
    },

}, {timestamps: true});

const Workflow = mongoose.model('workflows', workflow);

module.exports = Workflow;
