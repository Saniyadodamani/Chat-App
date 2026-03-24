import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';



export const signup=async(req,res)=>{
    const{fullName,email,password,bio}=req.body;

    try {
        if(!fullName || !email || !password || !bio){
            return res.json({success:false,message:"Missing Details"});
        }
        const user = await User.findOne({email});

        if(user){
            return res.json({success:false,message:"Account already exists"});
        }

        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        const newUser=new User({
            fullName,
            email,
            password:hashedPassword,
            bio
        });

        await newUser.save(); // Save the user to get the _id

        const token=generateToken(newUser._id);

        const safeUser = newUser.toObject();
        delete safeUser.password;
        res.json({success:true, user: safeUser,token, message :"Account created successfully"});

        
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

export const login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        const userData=await User.findOne({email});

        if(!userData){
            return res.json({success:false,message:"User not found"});
        }

        const isPasswordCorrect=await bcrypt.compare(password,userData.password);

        if(!isPasswordCorrect){
            return res.json({success:false,message:"Invalid Credentials"});
        }
        const token=generateToken(userData._id);
        const safeUser = userData.toObject();
        delete safeUser.password;
        res.json({success:true, user: safeUser,token, message :"Login successful"});
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

export const checkAuth=(req, res)=>{
    res.json({success:true, user:req.user});
}

export const updateProfilePic=async(req,res)=>{ 
    try{
        const {profilePic,bio,fullName}=req.body;
        const userId=req.user._id;
        let updateUser;

        if(!profilePic){
            updateUser=await User.findByIdAndUpdate(userId,{bio,fullName},
            {new:true});
        }else{
            // Store profile pic as base64 directly (no Cloudinary needed)
            updateUser=await User.findByIdAndUpdate(userId,{profilePic, bio, fullName},
            {new:true});
        }
        const safeUser = updateUser.toObject();
        delete safeUser.password;
        res.json({success:true,user:safeUser});
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

