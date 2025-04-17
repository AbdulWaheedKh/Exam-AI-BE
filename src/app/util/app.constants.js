
const AppConstants = {
    SECRET_KEY: "HBL-SPARK-INFOTECH-2024",
    UM_SERVICE_GROUP_ENDPOINT: "group/",
    ACC_SERVICE_ENDPOINT: "acc-open/",
    CIF_ACC_SERVICE_ENDPOINT: "cif-acc/remove/picked-by/",
    CIF_SERVICE_ENDPOINT: "cif-open/",
    RDA_SERVICE_ENDPOINT: "rda/",
    GENERATE_PROVISIONAL_ACCOUNT_NUMBER_ENDPOINT : "misys-provisional-account-number",

    ECIF_SERVICE_ENDPOINT: "ecif-open/",
    EACC_SERVICE_ENDPOINT: "eacc-open/",
    WF_COMMENT_AND_DISCREPANCY_ENDPOINT: "wf-comment-discrepancy/",

    //CIF,ACC & DAO update status
    ACC_SERVICE_UPDATE_WF_STATUS_ENDPOINT: "acc-open/update-wf-status/",
    CIF_SERVICE_UPDATE_WF_STATUS_ENDPOINT: "cif-open/update-wf-status/",
    DAO_SERVICE_UPDATE_WF_STATUS_ENDPOINT: "update-wf-status/",
    RDA_SERVICE_UPDATE_WF_STATUS_ENDPOINT: "rda/update-wf-status/",

    //E-CIF & E-ACC update status
    EACC_SERVICE_UPDATE_WF_STATUS_ENDPOINT: "eacc-open/update-wf-status/",
    ECIF_SERVICE_UPDATE_WF_STATUS_ENDPOINT: "ecif-open/update-wf-status/",

    //CBS calls to push CIF and ACC
    EXCHANGE_SERVICE_PUSH_ACC_CBS_ENDPOINT: "push-account-to-cbs",
    EXCHANGE_SERVICE_PUSH_CIF_CBS_ENDPOINT: "push-cif-to-cbs",


    STATUS_APPROVED : "APPROVED",
    STATUS_REVERTED : "REVERTED",
    STATUS_ACTIVATED : "ACTIVATED",
    WORKFLOW_OPERATION_SUBMIT : "Submit",

    HISTORY_OPERATIONS: {
        CREATED: "CREATED",
        MODIFIED: "MODIFIED",
        DELETED: "DELETED",
        ACTIVE: "ACTIVATED",
        SUSPEND: "SUSPENDED"
    }
};

module.exports = AppConstants;
