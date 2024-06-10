const router = require("express").Router();
const { ObjectId } = require("mongodb");
const userSchema = require("../mongoDB/models/userSchema");
const mongoose = require('mongoose');


const populateVideos = async (userData) => {
    const user = await userSchema.findById(userData._id);
    // const fileDocuments = await getFileDocuments(user.videos);
    const db = mongoose.connection.db;
    const filesCollection = db.collection('fs.files');
    let fileDocuments = []
    for (const videoId of user.videos) {
        const fileDocument = await filesCollection.findOne({ _id: new ObjectId(videoId) })
        fileDocuments.push(fileDocument)
    }
    const populatedUser = { ...user.toObject(), videos: fileDocuments };
    console.log(populatedUser);
    return populatedUser
};

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id
        let user = await userSchema.findOne({ _id: new ObjectId(userId) })

        if (!user) return res.status(401).json({ message: "User doesn't exist!" })

        user = await populateVideos(user)
        console.log(user)

        return res.status(200).json(user);
    } catch (error) {
        console.log(error)
        return res.status(401).json({ message: "Internal Server Error!", error });
    }
})

module.exports = router;