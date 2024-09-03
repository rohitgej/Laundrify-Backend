const fs = require('fs');

const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
        } else {
            console.warn(`File does not exist: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error deleting file: ${filePath}`, err.message);
    }
};

module.exports = { deleteFile };
