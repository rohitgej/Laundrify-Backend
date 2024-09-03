// const sharp = require('sharp');
// const fs = require('fs');
// const path = require('path');

// // Directory where your input images are stored
// const inputDir = path.join(__dirname, 'uploads');
// const outputDir = path.join(__dirname, 'converted');

// fs.readdir(inputDir, (err, files) => {
//     if (err) {
//         console.error('Error reading directory:', err);
//         return;
//     }
//     files.forEach(file => {
//         const inputImagePath = path.join(inputDir, file);
//         const outputImagePath = path.join(outputDir, `${path.parse(file).name}.webp`);

//         sharp(inputImagePath)
//             .webp({ quality: 80 }) 
//             .toFile(outputImagePath)
//             .then(() => {
//                 console.log(`Image ${file} successfully converted to WebP format`);
//             })
//             .catch(err => {
//                 console.error('Error converting image:', err);
//             });
//     });
// });


const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Directories for input and output images
const inputDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'converted');

// Ensure directories exist
const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
ensureDirExists(inputDir);
ensureDirExists(outputDir);

fs.readdir(inputDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }
    files.forEach(file => {
        const inputImagePath = path.join(inputDir, file);
        const outputImagePath = path.join(outputDir, `${path.parse(file).name}.webp`);

        // Convert image to WebP format
        sharp(inputImagePath)
            .webp({ quality: 80 })
            .toFile(outputImagePath)
            .then(() => {
                console.log(`Image ${file} successfully converted to WebP format`);

                // Attempt to delete the original file after successful conversion
                fs.unlink(inputImagePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Error deleting file: ${inputImagePath}`, unlinkErr.message);
                    } else {
                        console.log(`Successfully deleted file: ${inputImagePath}`);
                    }
                });
            })
            .catch(err => {
                console.error('Error converting image:', err);
            });
    });
});
