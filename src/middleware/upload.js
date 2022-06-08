const util = require("util");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const dbConfig = require("../config/db");

var storage = new GridFsStorage({
  url: dbConfig.url + dbConfig.database,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg", "image/gif"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-kalacloud-${file.originalname}`;
      return filename;
    }
    return {
      bucketName: dbConfig.filesBucket,
      filename: `${Date.now()}-kalacloud-${file.originalname}`
    };
  }
});
const maxSize = 2 * 1024 * 1024;
var uploadFiles = multer({ storage: storage, limits: { fileSize: maxSize } }).single("file");
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;
