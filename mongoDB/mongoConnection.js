const mongoose = require('mongoose')
let db = null

function connectDB() {
    // if (mongoose.connections[0].readyState) {
    //     console.log("DataBase atready connected!")
    //     return
    // }
    mongoose.set("strictQuery", false)
    mongoose.connect(process.env.MONGO_URI).then((data) => {
        console.log("MongoDB connected!")
        db = data
    }).catch((err) => {
        console.log('Database connection ERROR :', err)
    })
}

module.exports = { connectDB, db }
