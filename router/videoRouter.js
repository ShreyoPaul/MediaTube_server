const router = require("express").Router();
const multer = require('multer');
const path = require('path')
// const upload = multer({ dest: 'uploads/' })
const fs = require("fs");
const mongoose = require('mongoose');
const userSchema = require("../mongoDB/models/userSchema");
const { ObjectId } = require("mongodb");
const { authenticateToken } = require("../utils/authentication");

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // specify where to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // specify the name of the uploaded file
    }
});

const getDirSize = (dirPath) => {
    let size = 0;
    const files = fs.readdirSync(dirPath);

    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(dirPath, files[i]);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            size += stats.size;
        } else if (stats.isDirectory()) {
            size += getDirSize(filePath);
        }
    }

    return (size / 1048576).toFixed(2);
};

const upload = multer({ storage: storage });

router.get("/test", (req, res) => {
    const { db } = mongoose.connection;
    console.log(db)
    res.send("Hello user! Warm wishings! Test", db)
})

router.post('/upload', authenticateToken, upload.fields([{ name: 'file' }, { name: 'thumbnail' }]), async function (req, res) {
    try {
        if (getDirSize('uploads') > 500) return res.status(401).json({ message: "Server is busy! Try after some time!" });
        console.log(getDirSize('uploads'))
        const { db } = mongoose.connection;
        const bucket = new mongoose.mongo.GridFSBucket(db);
        const bucket2 = new mongoose.mongo.GridFSBucket(db, { bucketName: 'thumbnail' });
        const a = await userSchema.findOne({ email: req.user.email })

        if (!a) return res.status(401).json({ message: "User doesn't exist!" })

        if (a.max_no_of_videos <= a.videos.length) return res.status(401).json({ message: `Uploaded maximum videos! Can't upload more than ${a.max_no_of_videos} ${a.max_no_of_videos > 1 ? 'videos' : 'video'}.` });
        // const bucket = new mongodb.GridFSBucket(db);
        console.log(req.files.file[0])
        // const videoUploadStream = bucket.openUploadStream(`vid_${new Date().getTime()}`);
        // const videoReadStream = fs.createReadStream('./vid.mp4');
        // videoReadStream.pipe(videoUploadStream);
        const tags = req.body.tags.split(",")
        // const fileBuffer = req.files.file[0].buffer;
        const filename = req.files.file[0].originalname;
        const thumbnailname = req.files.thumbnail[0].originalname;
        const id = new Date().getTime()
        const uploadStream = bucket.openUploadStream(
            filename.split(" ").join("_").split(".")[0] + `${id}`,
            {
                metadata: {
                    title: req.body.title,
                    desc: req.body.desc,
                    like: [],
                    thumbnail: id,
                    tags: tags
                }
            }
        );
        const uploadStream2 = bucket2.openUploadStream(id, {
            metadata: {
                tags: tags
            }
        });

        // uploadStream.end(fileBuffer);
        const videoReadStream = fs.createReadStream(req.files.file[0].path);
        videoReadStream.pipe(uploadStream);
        const thumbnailReadStream = fs.createReadStream(req.files.thumbnail[0].path);
        thumbnailReadStream.pipe(uploadStream2);

        const video = await userSchema.updateOne({ _id: a._id }, { $push: { videos: { videoId: uploadStream.id.toString(), thumbnailId: uploadStream2.id.toString() } } })
        // const video = await userSchema.updateOne({ _id: a._id }, { $push: { videos: uploadStream.id.toString() } })
        console.log(uploadStream)
        if (video) {
            fs.unlink('uploads/' + filename, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('File is deleted.');
                }
            });
            fs.unlink('uploads/' + thumbnailname, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('File is deleted.');
                }
            });
            return res.status(200).json(video);
        }
        return res.status(401).json({ message: "Internal Server Error!" });


    } catch (error) {
        console.log(error)
        return res.status(401).json({ message: "Internal Server Error! Not Uplaod!", error });
    }
});

router.get("/play", async function (req, res) {

    // Check for range headers to find our start time
    const range = req.headers.range || '10';
    if (!range) {
        res.status(400).send("Requires Range header");
    }

    const { db } = mongoose.connection;

    // GridFS Collection
    const video = await db.collection('fs.files').findOne()

    if (!video) {
        res.status(404).send("No video uploaded!");
        return;
    }

    console.log(video)


    // Create response headers
    const videoSize = video.length;
    const start = Number(range.replace(/\D/g, ""));
    const end = videoSize - 1;

    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);
    console.log("video")

    // Get the bucket and download stream from GridFS
    bucket = new mongoose.mongo.GridFSBucket(db);
    const downloadStream = bucket.openDownloadStreamByName('vid1715024848306');

    // Finally pipe video to response
    downloadStream.pipe(res);
});

router.post('/upload_try', upload.single('file'), async function (req, res) {
    try {
        const { db } = mongoose.connection;
        bucket = new mongoose.mongo.GridFSBucket(db);
        // const bucket = new mongodb.GridFSBucket(db);
        const filename = req.file.originalname;
        console.log("filename", filename)
        const videoUploadStream = bucket.openUploadStream(`vid_${new Date().getTime()}`);
        const videoReadStream = fs.createReadStream(req.file.path);
        videoReadStream.pipe(videoUploadStream);



        const a = await userSchema.findOne({ email: req.body.email })
        console.log(a)

        const video = await userSchema.updateOne({ _id: a._id }, { $push: { videos: videoUploadStream.id.toString() } })

        if (video) {
            fs.unlink('uploads/' + req.file.originalname, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('File is deleted.');
                }
            });
            return res.status(200).json(video);
        }
        return res.status(401).json({ message: "Internal Server Error!" });

    } catch (error) {
        console.log(error)
        return res.status(401).json({ message: "Internal Server Error! Not Uplaod!", error });
    }
});

router.get("/play_try/:video", async function (req, res) {

    // Check for range headers to find our start time
    const range = req.headers.range || '10';
    if (!range) {
        res.status(400).send("Requires Range header");
    }

    const { db } = mongoose.connection;

    // GridFS Collection
    const video = await db.collection('fs.files').findOne({ _id: new ObjectId(req.params.video) })

    if (!video) {
        res.status(404).send("No video uploaded!");
        return;
    }

    // Create response headers
    const videoSize = video.length;
    const start = Number(range.replace(/\D/g, ""));
    const end = videoSize - 1;

    // console.log(start, end)

    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);
    // console.log("video")

    // Get the bucket and download stream from GridFS
    bucket = new mongoose.mongo.GridFSBucket(db);
    const downloadStream = bucket.openDownloadStreamByName(video.filename);

    // console.log(downloadStream)

    // Finally pipe video to response
    downloadStream.pipe(res);
});

router.post('/play_try', upload.single('file'), (req, res) => {
    console.log(req.file)
    const { db } = mongoose.connection;
    bucket = new mongoose.mongo.GridFSBucket(db);
    // const bucket = new mongodb.GridFSBucket(db);

    // const videoUploadStream = bucket.openUploadStream(`vid_${new Date().getTime()}`);
    // const videoReadStream = fs.createReadStream(`./uploads/${req.file.originalname}`);
    // videoReadStream.pipe(videoUploadStream);

    // console.log(videoUploadStream)
    // res.status(200).json("ok")

    const fileBuffer = req.file.buffer;
    const filename = req.file.originalname;

    const uploadStream = bucket.openUploadStream(filename);
    uploadStream.end(fileBuffer);

    uploadStream.on('finish', () => {
        console.log('File uploaded successfully');
        res.send('File uploaded successfully');
    });
})

router.post('/videos', async function (req, res) {
    const { db } = mongoose.connection
    const { tags, thumbnailname } = req.body
    // console.log("body", req.body)
    // const video = await db.collection('fs.files').find({_id:new ObjectId('6641e01ad872445d08cc9938')})
    const bucket = new mongoose.mongo.GridFSBucket(db);
    let cursor = (!tags || !Array.isArray(tags)) ? bucket.find({}) : bucket.find({
        $and: [
            { 'metadata.tags': { $in: tags } },
            { 'metadata.thumbnail': { $not: { $eq: parseInt(thumbnailname) } } }
        ]
    });

    let result = []
    for await (const doc of cursor) {
        // console.log(doc);
        result.push(doc)
    }

    const bucket2 = new mongoose.mongo.GridFSBucket(db, { bucketName: 'thumbnail' });
    let cursor2 = (!tags || !Array.isArray(tags)) ? bucket2.find({}) : bucket2.find({
        $and: [
            { 'metadata.tags': { $in: tags } },
            { filename: { $not: { $eq: parseInt(thumbnailname) } } }
        ]
    });
    let thumbnail = []
    for await (const doc of cursor2) {
        // console.log(doc);
        thumbnail.push(doc)
    }

    if (result.length === 0 || thumbnail.length === 0) {
        cursor = bucket.find({ 'metadata.thumbnail': { $not: { $eq: parseInt(thumbnailname) } } })
        cursor2 = bucket2.find({ filename: { $not: { $eq: parseInt(thumbnailname) } } })
        for await (const doc of cursor) {
            // console.log(doc);
            result.push(doc)
        }
        for await (const doc of cursor2) {
            // console.log(doc);
            thumbnail.push(doc)
        }
    }

    return res.json({ result, thumbnail })
})

router.post('/myvideos', authenticateToken, async function (req, res) {
    const { db } = mongoose.connection
    // const { tags, thumbnailname } = req.body
    // console.log("body", req.body)
    const a = await userSchema.findOne({ email: req.user.email })
    // const video = await db.collection('fs.files').find({_id:new ObjectId('6641e01ad872445d08cc9938')})
    const x = a.videos.map(video => video.videoId)
    // console.log(x)
    const bucket = new mongoose.mongo.GridFSBucket(db);
    let cursor = bucket.find({ _id: { $in: x.map(id => new ObjectId(id)) } });

    let thumbnail_files_arr = []
    let result = []
    for await (const doc of cursor) {
        // console.log(doc);
        result.push(doc)
        thumbnail_files_arr.push(doc.metadata.thumbnail)
    }

    const bucket2 = new mongoose.mongo.GridFSBucket(db, { bucketName: 'thumbnail' });
    let cursor2 = bucket2.find({ filename: { $in: thumbnail_files_arr } });
    let thumbnail = []
    for await (const doc of cursor2) {
        // console.log(doc);
        thumbnail.push(doc)
    }

    return res.json({ result, thumbnail })
})

router.post('/video_details', authenticateToken, async (req, res) => {
    const { db } = mongoose.connection;

    const video = await db.collection('fs.files').findOne({ _id: new ObjectId(req.body.videoid) })
    const thumbnail = await db.collection('thumbnail.files').findOne({ filename: req.body.thumbnailname })
    // console.log("/video_details", video, thumbnail)
    if (!video) {
        res.status(404).send("No video uploaded!");
        return;
    }
    else if (!thumbnail) {
        res.status(404).send("No thumbnail uploaded!");
        return;
    }

    return res.status(200).json({ data: video?.metadata, thumbnail })
})

router.get('/thumbnail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // console.log(id)
        const { db } = mongoose.connection;
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'thumbnail' });

        const thumbnailStream = bucket.openDownloadStream(new ObjectId(id));
        thumbnailStream.on('data', (chunk) => res.write(chunk))
        thumbnailStream.on('end', () => res.end())

        // const writeStream = fs.createWriteStream('my-file.png');
        // thumbnailStream.pipe(writeStream);
        // console.log(thumbnailStream)

        // thumbnailStream.on('error', (err) => {
        //     res.status(404).send('Thumbnail not found');
        // });

        // res.set('Content-Type', 'image/png');
        // thumbnailStream.pipe(res);

        // const x = await db.collection('thumbnail.files').findOne({ _id: new ObjectId('664953ca80a66bb7117419ba') })
        // console.log("file", x)
        // return res.json(x)

    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/like', authenticateToken, async (req, res) => {
    try {
        const { videoid } = req.body
        const email = req.user.email
        const { db } = mongoose.connection;
        const filesCollection = db.collection('fs.files');

        const findUser = await filesCollection.findOne({ 'metadata.like': email, _id: new ObjectId(videoid) })
        // console.log(findUser)
        if (!findUser) {
            const file = await filesCollection.updateOne({ _id: new ObjectId(videoid) }, { $push: { 'metadata.like': email } })

            if (file) return res.status(200).json({ msg: 'You like the content!', toggle: true })
            return res.status(401).json({ msg: "You can't like the content!", toggle: false })
        } else {
            const file = await filesCollection.updateOne({ _id: new ObjectId(videoid) }, { $pull: { 'metadata.like': email } })

            if (file) return res.status(200).json({ msg: 'Undo like!', toggle: false })
            return res.status(401).json({ msg: "You can't undo the content!", toggle: true })
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message);
    }
})

router.delete('/delete', authenticateToken, async (req, res) => {
    try {
        const { videoid, thumbnailid } = req.body;
        const { db } = mongoose.connection;
        const bucket = new mongoose.mongo.GridFSBucket(db);
        const bucket2 = new mongoose.mongo.GridFSBucket(db, { bucketName: 'thumbnail' });
        const users = db.collection('users')

        // const filesCollection = db.collection('thumbnail.files');
        // const findUser = await filesCollection.findOne({ filename: parseInt(thumbnail) })

        // if (!findUser) {
        //     return res.status(404).json({ msg: "Video & Thumbnail are not found!" });
        // }
        users.updateOne({ email: req.user.email }, { $pull: { videos: { videoId: videoid } } })
        bucket.delete(new ObjectId(videoid));
        bucket2.delete(new ObjectId(thumbnailid));
        return res.status(200).json({ msg: 'Deleted successfully' })

    } catch (error) {
        res.status(500).send(error.message);
    }
})

module.exports = router;