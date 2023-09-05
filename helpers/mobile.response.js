// create response
export const create_response = (msg,res) => 
{
res.status(200).json(
    {
        "status":true,
        "msg":msg
    });
};

// fetch data response 
export const fetch_data = (langType, data, res) => {
  console.log("skjfhskjfh",langType);
    res.status(200).json({
    status: true,
    msg:
      langType === "en"
        ? "Data get successfully!"
        : "Les données obtiennent avec succès !",
    data: data,
  });
};


// error response 
export const error_response = (error,res) => 
{
res.status(400).json(
    {
        "status":false,
        "msg":error
    });
}

// custom response 
export const custom_response =(data,msg,res) => 
{
res.status(200).json(
    {
        "status":true,
        "msg":msg,
        "data":data
    });
}
