const path = require('path');
require("dotenv").config({path: path.format({dir: "environment/.env"})});
const cors = require('cors');
const logger = require('./logger/index');
// const consul = require('consul');
const express = require('express');
const app = express();
const connectDB = require('./config/database');

// config connection
connectDB().then(r => logger.info("Connected to DB"));

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));
app.use(cors());                    // enable CORS

// Import routes
const workflowRouter = require('./route/workflow.router');
const workflowAccRouter = require('./route/workflow.cif.acc.router');
const workflowEAccEcifRouter = require('./route/workflow.ecif.eacc.router');
const authRouter = require('./route/auth.router');
const chapterRouter = require('./route/chapter.router');
const quizRouter = require('./route/quiz.router');
const quizResultRouter = require('./route/quizResult.router');
const classRouter = require('./route/class.router');
const subjectRouter = require('./route/subject.router');
const enrollmentRouter = require('./route/enrollment.router');

// Use routes
app.use("/", workflowRouter);
app.use("/wf-acc-cif", workflowAccRouter);
app.use("/wf-eacc-ecif", workflowEAccEcifRouter);
app.use("/api", authRouter);
app.use("/api/chapters", chapterRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/quiz-results", quizResultRouter);
app.use("/api/classes", classRouter);
app.use("/api/subjects", subjectRouter);
app.use("/api/enrollment", enrollmentRouter);


app.listen(process.env.PORT, () => {
    logger.info(`Config Server up and running on PORT: ${process.env.PORT}`);
});
