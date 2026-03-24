import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({

    senderId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    receiverId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    text: {type: String, },
    image: {type: String, },
    voice: {type: String, },
    seen: {type: Boolean, default: false},
    deleted: {type: Boolean, default: false}
},{timestamps:true, bufferCommands: false});
const Message = mongoose.model("Message",MessageSchema);
export default Message;
