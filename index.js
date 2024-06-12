const dotenv = require("dotenv")
dotenv.config()

const cors = require("cors")
const express = require("express");
const { connectDB } = require("./mongoDB/mongoConnection");
const authRouter = require("./router/auth");
const mediaRouter = require("./router/videoRouter");
const userRouter = require("./router/userRouter");
const { default: mongoose } = require("mongoose");

const PORT = 8001
const app = express();

connectDB()

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "OPTION", "PUT"]
}))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use("/auth", authRouter);
app.use("/media", mediaRouter);
app.use("/user", userRouter);

app.get("/", (req, res) => {
    res.send("Hello user! Warm wishings!",)
})

app.get("/test", (req, res) => {
    const { db } = mongoose.connection;
    console.log(db)
    res.json({ data: db.collection('users').find() })
})


app.listen(process.env.PORT || PORT, function () {
    console.log(`Listening on port ${PORT}!`);

});