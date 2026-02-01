import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute=async(req,res,next)=>{
    try {
        const authHeader=req.headers.authorization;
        if(!authHeader) return res.json({success:false,message:"No token provided"});

        const parts = authHeader.split(' ');
        if(parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]){
            return res.json({success:false,message:"Invalid authorization header"});
        }

        const token=parts[1]; // Bearer <token>

        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findById(decoded.userId).select("-password");

        if(!user) return res.json({success:false,message:"User not found"});

        req.user=user;
        next();
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}