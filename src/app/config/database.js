const mongoose = require('mongoose');
const logger = require('../logger/index');

/**
 * Const function to connect with Database
 * */
const connectDB = async () => {
    try {
        const url = `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
        await mongoose.connect(url, {});
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', () => {
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        logger.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

module.exports = connectDB;
