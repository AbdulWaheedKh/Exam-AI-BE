const express = require('express');
const {
    runEAccountWorkflow,runECifWorkflow,runEAccountAndECifWorkflow
} = require('../controller/workflow.ecif.eacc.controller');
const router = require("express").Router();

router.put('/run-workflow-eacc/:id', runEAccountWorkflow);
router.put('/run-workflow-ecif/:id', runECifWorkflow);
router.put('/run-workflow-ecif-eacc/:id', runEAccountAndECifWorkflow);

module.exports = router;
