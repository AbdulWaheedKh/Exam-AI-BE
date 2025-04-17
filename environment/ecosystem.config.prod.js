module.exports = {
    apps: [{
        name: "workflows-service",
        script: "workflow-service/src/app/app.js",
        watch: true,
        env: {
            PORT: 8088,
            NODE_ENV: "prod",
            DB_PORT: 27017,
            DB_HOST: "mongodb://192.168.36.50",
            DB_USER: "root",
            DB_PASSWORD: "root",
            DB_NAME: "spark_qa",
            REPLICA_SET: "myReplicaSet",
            PASS_ENCRYPT_KEY: "it-spark-encrypt",
            SERVICE_NAME: "workflow-service",
            SERVICE_ADDRESS: "localhost",
            LOG_PATH: "C:/Spark/logs/spark.log",
            UPLOAD_PATH: "C:/Spark/uploads",
            HISTORY_SERVICE_URL: "http://192.168.36.51:8084/",
            UM_SERVICE_URL: "http://192.168.36.51:8082/",
            DAO_SERVICE_URL: "http://192.168.36.51:8089/",
            ACC_SERVICE_URL: "http://192.168.36.51:8085/",
            EXCHANGE_SERVICE_URL: "http://192.168.36.51:8086/",
            RDA_DAO_SERVICE_URL: "http://192.168.36.51:8089/",
            GENERATE_PROVISIONAL_ACCOUNT_NUMBER_URL: "http://192.168.36.51:8086/"
        }
    }]
}
