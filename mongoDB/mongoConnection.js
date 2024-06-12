const mongoose = require('mongoose')
let db = null


mongoose.set("strictQuery", false)
mongoose.connect(process.env.MONGO_URI).then((data) => {
    console.log("MongoDB connected!")
    db = data
}).catch((err) => {
    console.log('Database connection ERROR :', err)
})


// mongoose.set('strictQuery', false)

// mongoose.connect(DB_uri, {

// }).then(() => {
//     console.log("MongoDB connected!")
// }).catch((error) => console.log(error))

module.exports = { connectDB, db }
