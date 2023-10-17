import  express  from "express";
import cors from "cors";
import bodyparser from 'body-parser';
import apiRouter from "./routes/api_routes.js"
import http from 'http';
import "./config/db.js";

var app = express();
//Configuring express server
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false,limit: '50mb' }));

// enabled cors 
app.use(cors());

// inside public directory.
app.use(express.static('public')); 
app.use("/uploads", express.static("uploads"));
const PORT = process.env.PORT || 3000;
app.use('/api', apiRouter);   

const server = http.createServer(app);
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));    

app.use(function(req, res, next) 
{   
    res.status(404).json({ status: false, msg: "Api endpoint does not found!" });
});
