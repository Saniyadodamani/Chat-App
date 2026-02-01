import { createContext,useContext,useEffect, useState, useCallback } from "react";
import {AuthContext} from "./AutoContext"
import toast from "react-hot-toast"

export const ChatContext=createContext();

export const ChatProvider=({children})=>{

    const[messages, setMessages]= useState([]);
    const[users, setUsers]= useState([]);
    const [selectedUser, setSelectedUser]= useState(null)
    const[ unseenMessages, setUnseenMessages]= useState({})

    const {socket, axios, authUser}= useContext(AuthContext);


    const getUsers= useCallback(async()=>{
        try{
            const{ data}= await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users)
                const normalized = {}
                if(data.unseenMessages){
                    Object.keys(data.unseenMessages).forEach((k)=>{
                        normalized[String(k)] = data.unseenMessages[k]
                    })
                }
                setUnseenMessages(normalized)
            } else {
                toast.error(data.message)
            }
        } catch(error){
            toast.error(error.message)
        }
    }, [axios])

    useEffect(()=>{
        if(authUser){
            getUsers();
        }
    }, [authUser, getUsers])

    const getMessages= useCallback(async (userId)=>{
        try{
            const {data}=await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages)
            }
        }catch(error){
            toast.error(error.message)
        }
    }, [axios])


    const sendMessage= async(messageData)=>{
        if(!selectedUser?._id){
            toast.error("Select a user to chat")
            return;
        }
        try{
            const{data}= await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages, data.message])
            } else{
                toast.error(data.message);
            }
        } catch(error){
            toast.error(error.message)
        }
    }

    const subscribeToMessages = useCallback(async()=>{
        if(!socket) return;

        socket.on("newMessage", (newMessage)=>{
            const senderId = typeof newMessage.senderId === "object" ? String(newMessage.senderId) : String(newMessage.senderId)
            const selectedId = selectedUser?._id ? String(selectedUser._id) : null

            if(selectedId && senderId === selectedId){
                newMessage.seen= true;
                setMessages((prevMessages)=> [...prevMessages, newMessage]);
                // Mark message as seen with error handling
                axios.put(`/api/messages/mark/${newMessage._id}`).catch(error => {
                    console.error("Failed to mark message as seen:", error);
                });

            } else{
                const senderKey = String(newMessage.senderId)
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages, [senderKey]:
                    prevUnseenMessages[senderKey] ? prevUnseenMessages[senderKey] + 1 : 1
                }))
            }
        })
    }, [socket, selectedUser, axios])
           
    const unsubscribeFromMessages = useCallback(()=>{
        if(socket)socket.off("newMessage");
    }, [socket])

    useEffect(()=>{
        subscribeToMessages();
        return()=> unsubscribeFromMessages();
    },[subscribeToMessages, unsubscribeFromMessages])

    const value={
        messages, users, selectedUser, getUsers, getMessages, sendMessage, 
        setSelectedUser, unseenMessages, setUnseenMessages 
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}
