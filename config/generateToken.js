import jwt from "jsonwebtoken";

export const generateToken = (payload) => 
{
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30d" });
    return token;
};

export const verifyJwtToken = (token, next) => 
{
    try {
      const { userId } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      return userId;
    } catch (err) {
      next(err);
    }
};


