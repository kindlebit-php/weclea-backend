import mySql from "mysql";
export const  db=()=>{
    mySql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        multipleStatements: true,
        dateStrings: true
    });
    
    connection.connect((err)=> {
        if(!err)
            console.log('Connection Established Successfully');
        else
            console.log('Connection Failed!'+ JSON.stringify(err,undefined,2));
    });
}

