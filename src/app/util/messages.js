const fs = require('fs');
const path = require('path');

// Function to load messages from properties file
function loadMessages(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');
        const messages = {};
        lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                messages[key.trim()] = value.trim();
            }
        });
        return messages;
    } catch (err) {
        console.error('Error loading messages:', err);
        return {};
    }
}

// Load messages from properties file
const messagesFilePath = path.join(__dirname, '../../../environment/messages.properties');
const messages = loadMessages(messagesFilePath);

// Function to get message by key
function getMessage(key) {
    return messages[key] || '';
}

module.exports = {
    getMessage
};
