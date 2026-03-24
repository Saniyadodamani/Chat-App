import Message from '../models/Message.js';
import User from '../models/User.js';
import {io, userSocketMap} from "../server.js";

export const getUserForSidebar=async(req,res)=>{
    try {
        const userId=req.user._id;
        const filteredUsers=await User.find({_id:{$ne:userId}}).select("-password");

        const unseenMessages={}
        const promises=filteredUsers.map(async(user)=>{
            const messages = await Message.find({senderId:user._id,receiverId:userId,seen:false, deleted:false});
            if(messages.length>0){
                unseenMessages[user._id]=messages.length;
            }

        });

        await Promise.all(promises);
        res.json({success:true, users:filteredUsers, unseenMessages});
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

export const getMessages=async(req,res)=>{
    try {
        const {id:selectedUserId}= req.params;
        const myId=req.user._id;

        const messages=await Message.find({
            $or:[
                {senderId:myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId},
            ],
            deleted: false
        });
        await Message.updateMany({senderId: selectedUserId, receiverId: myId, seen: false},
            {seen:true});

        // Emit messageSeen event to sender so their UI updates read receipts
        const senderSocketId = userSocketMap[selectedUserId];
        if(senderSocketId){
            io.to(senderSocketId).emit("messageSeen", { by: String(myId) });
        }

        res.json({success: true, messages});

        }catch(error){
            console.log(error.message);
            res.json({success: false, message: error.message})
        }
    }

    export const markMessageAsSeen= async(req,res)=>{

        try{
            const {id}=req.params;
            await Message.findByIdAndUpdate(id, {seen:true});

            // Get the message to emit event to sender
            const message = await Message.findById(id);
            if(message){
                const senderSocketId = userSocketMap[String(message.senderId)];
                if(senderSocketId){
                    io.to(senderSocketId).emit("messageSeen", { by: String(message.receiverId) });
                }
            }

            res.json({success:true});

        } catch(error){
            console.log(error.message);
            res.json({success:false, message:error.message})
        }
    }

    export const sendMessage= async(req, res)=>{
        try{
            const {text, image, voice}=req.body;
            const receiverId=req.params.id;
            const senderId=req.user._id;

            // Store images and voice as base64 directly (no Cloudinary needed)
            const newMessage= await Message.create({
                senderId,
                receiverId,
                text,
                image: image || null,
                voice: voice || null
            });
             
            const receiverSocketId= userSocketMap[receiverId];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("newMessage", newMessage)
            }

            res.json({success:true, message:newMessage});
        } catch(error){
            console.log(error.message);
            res.json({success: false, message:error.message})
        }
    }

    export const deleteMessage = async(req, res) => {
        try {
            const {id} = req.params;
            const userId = req.user._id;

            const message = await Message.findById(id);
            if(!message){
                return res.json({success: false, message: "Message not found"});
            }

            // Only sender can delete their own message
            if(String(message.senderId) !== String(userId)){
                return res.json({success: false, message: "Not authorized"});
            }

            message.deleted = true;
            message.text = "";
            message.image = "";
            message.voice = "";
            await message.save();

            // Notify receiver about deleted message
            const receiverSocketId = userSocketMap[String(message.receiverId)];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
            }

            res.json({success: true, messageId: id});
        } catch(error){
            console.log(error.message);
            res.json({success: false, message: error.message});
        }
    }
