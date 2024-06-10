
const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
//     email: {
//         type: String,
//         required: true
//     },
// }, {
    timestamps: true
})

mongoose.model("fs.files", fileSchema)

module.exports = mongoose.model("fs.files", fileSchema)