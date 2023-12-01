import  express  from "express";
import cors from "cors";
import bodyparser from 'body-parser';
import apiRouter from "./routes/api_routes.js"
import http from 'http';
import "./config/db.js";
import ejs from"ejs"
import path from 'path';
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
var app = express();

app.use(bodyparser.json({limit: '100mb'}));
app.use(express.static(__dirname+'/views'));
app.set('view engine','ejs');
app.use(
  bodyparser.urlencoded({
    extended: true,
    limit: '100mb',
    parameterLimit: 50000,
  }),
);
// enabled cors 
app.use(cors());

// inside public directory.
app.use(express.static('public')); 
app.use("/uploads", express.static("uploads"));
const PORT = process.env.PORT || 3000;
app.use('/api', apiRouter);   
app.get('/api/already_verified',(req, res) => { res.render('Login'); });
const server = http.createServer(app);
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));    


app.use(function(req, res, next) 
{   
    res.status(404).json({ status: false, msg: "Api endpoint does not found!" });

});
