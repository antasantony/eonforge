const multer = require('multer');
const path = require('path');




const storage= multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,"../public/uploads/re-image"))
    },
    filename:(req,file,cb)=>{
      cb(null,Date.now()+"-"+file.originalname)
    }
})


const uploads = multer({ storage });


module.exports = uploads;


// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Ensure directory exists
// const uploadPath = path.join(__dirname, "../public/uploads/re-image");
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// // Multer storage setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     // Get the file extension
//     const ext = path.extname(file.originalname);
//     // Sanitize filename
//     const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
//     cb(null, Date.now() + "-" + baseName + ext);
//   }
// });

// // Export full multer setup
// module.exports = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     // Only accept image files
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   },
//   limits: {
//     fileSize: 5 * 1024 * 1024 // Max file size: 5MB
//   }
// });
