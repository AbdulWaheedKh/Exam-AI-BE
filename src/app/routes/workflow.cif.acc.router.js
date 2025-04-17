const express = require('express');
const {
    runAccountWorkflow,runCifWorkflow,runDAOWorkflow,runRDAWorkflow,runCifAndAccountWorkflow,runCifMaintAndAccOpenWorkflow
} = require('../controller/workflow.cif.acc.controller');

const router = require("express").Router();

router.put('/run-workflow-acc/:id', runAccountWorkflow);
router.put('/run-workflow-cif/:id', runCifWorkflow);
router.put('/run-workflow-dao/:id', runDAOWorkflow);
router.put('/run-workflow-rda/:id', runRDAWorkflow);
router.put('/run-workflow-cif-acc/:id', runCifAndAccountWorkflow);
router.put('/run-workflow-cif-maintenance-acc-open/:id', runCifMaintAndAccOpenWorkflow);

module.exports = router;
