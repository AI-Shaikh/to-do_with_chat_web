import jwt from "jsonwebtoken"

export const generateToken= (userId, res)=> {

  const token = jwt.sign({userId}, process.env.JWT_SECRET, {
    expiresIn: "7d",//user will need to login again in 7 days
  })

  res.cookie("jwt",token,{
    maxAge: 7*24*60*60*1000, //MS
    httpOnly: true,//prevents XXS attacks cross-site scripting attacks
    sameSite: "lax",// prevents CSRF attacks
    secure: process.env.NODE_ENV !== "development",
    path: "/", // Add this line
  })

  return token;
}