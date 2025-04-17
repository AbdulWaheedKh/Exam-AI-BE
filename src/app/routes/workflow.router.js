const express = require('express');
const {
    createWorkflow,
    getWorkflows,
    getWorkflow,
    updateWorkflow,
    deleteWorkflow,
    searchWorkflow
} = require('../controller/workflow.controller');
const router = require("express").Router();
router.post('/', createWorkflow);
router.get('/get-all-workflows', getWorkflows);
router.get('/get-workflow/:id', getWorkflow);
router.put('/update-workflow/:id', updateWorkflow);
router.delete('/delete-workflow/:id', deleteWorkflow);
router.get('/search', searchWorkflow);

module.exports = router;
