const dotenv = require("dotenv")
dotenv.config()

const cors = require("cors")
const express = require("express");
const { connectDB } = require("./mongoDB/mongoConnection");
const authRouter = require("./router/auth");
const mediaRouter = require("./router/videoRouter");
const userRouter = require("./router/userRouter");

const PORT = 8001
const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "OPTION", "PUT"]
}))

app.use(express.json());
app.use(express.urlencoded({ extended: false, parameterLimit: 10 }));


app.use("/auth", authRouter);
app.use("/media", mediaRouter);
app.use("/user", userRouter);


app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}!`);
    connectDB()
});