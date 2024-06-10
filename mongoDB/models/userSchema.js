const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    videos: [
        {
            videoId: {
                type: String,
                ref: 'fs.files'
            },
            thumbnailId: {
                type: String,
                ref: 'thumbnail.files'
            }
        }
    ],
    max_no_of_videos: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})

mongoose.model("users", userSchema)

module.exports = mongoose.model("users", userSchema)