import  express  from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import apiRouter from "./routes/api_routes.js"
// import { db } from "./config/db.js";
import "./config/db.js";

dotenv.config();
const app= express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use('/api', apiRouter);
app.use(morgan("combined"));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));



// db();
app.listen(process.env.PORT,()=>{
    console.log(`server is live on port ${process.env.PORT}`)
})

// 404 page not found error handling  middleware
app.use("*", function (req, res) {
    res.status(404).json({ status: false, msg: "Api endpoint does not found!" });
  });
  
  // global error handling middleware
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const msg = err.message || "SERVER_ERR";
    const data = err.data || null;
    res.status(status).json({
      type: "error",
      msg,
      data,
    });
  });
  
  