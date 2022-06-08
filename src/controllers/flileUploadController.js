const upload = require("../middleware/upload");
const dbConfig = require("../config/db");

const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;

const url = dbConfig.url; 

const baseUrl = "http://localhost:8080/files/";

const mongoClient = new MongoClient(url);

const uploadFiles = async (req, res) => {
  try {
    await upload(req, res);
    if (req.file == undefined)  {
      return res.status(400).send({ message: "请选择要上传的文件" });
    }
    return res.status(200).send({
      message: "文件上传成功" + req.file.originalname,
    });
  } catch (error) {
    console.log(error);
     if (error.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "文件大小不能超过 2MB",
      });
    }
    return res.status(500).send({
      message: `无法上传文件:, ${error}`
    });
  }
};

const getListFiles = async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db(dbConfig.database); 
    const files = database.collection(dbConfig.filesBucket + ".files");
    let fileInfos = [];

    if ((await files.estimatedDocumentCount()) === 0) {
        fileInfos = []
    }

    let cursor = files.find({})
    await cursor.forEach((doc) => {
      fileInfos.push({
        name: doc.filename,
        url: baseUrl + doc.filename,
      });
    });

    return res.status(200).send(fileInfos);
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

const download = async (req, res) => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db(dbConfig.database);
    const bucket = new GridFSBucket(database, {
      bucketName: dbConfig.filesBucket,
    });

    let downloadStream = bucket.openDownloadStreamByName(req.params.name);
    downloadStream.on("data", function (data) {
      return res.status(200).write(data);
    });

    downloadStream.on("error", function (err) {
      return res.status(404).send({ message: "无法获取文件" });
    });

    downloadStream.on("end", () => {
      return res.end();
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  uploadFiles,
  getListFiles,
  download,
};

