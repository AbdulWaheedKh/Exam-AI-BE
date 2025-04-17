const {format, createLogger, transports} = require('winston');
const {timestamp, combine, printf, errors} = format;

function buildProdLogger() {
    const logFormat = printf(({level, message, timestamp, stack}) => {
        return `${timestamp} ${level}: ${stack || message}`;
    });

    return createLogger({
        format: combine(
            timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            errors({stack: true}),
            logFormat
        ),
        transports: [
            new transports.Console({}),
            new transports.File({
                filename: process.env.LOG_PATH,
            })],
    });
}

module.exports = buildProdLogger;
