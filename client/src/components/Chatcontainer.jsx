import React, { useRef, useEffect, useState, useContext } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import {ChatContext} from '../../context/ChatContext'
import {AuthContext} from '../../context/AutoContext'
import toast from 'react-hot-toast'

const Chatcontainer = () => {

  const{ messages, selectedUser, setSelectedUser, sendMessage, getMessages} = useContext(ChatContext)
  const { onlineUsers, authUser } = useContext(AuthContext)
  
  const scrollEnd = useRef()
  const [input, setInput] = useState('');

  const handleSendMessage = async(e) => {
    e.preventDefault();
    if(input.trim() === "") return;
    await sendMessage({text: input.trim()});
    setInput("");
  }

  const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if(!file || !file.type.startsWith("image/")){
      toast.error("select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async() => {
      await sendMessage({image: reader.result});
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if(selectedUser){
      getMessages(selectedUser._id)
    }
  }, [selectedUser, getMessages])

  useEffect(() => {
    if(scrollEnd.current && messages){
      scrollEnd.current.scrollIntoView({behavior:"smooth"})
    }
  }, [messages])

  const authUserId = authUser?._id ? String(authUser._id) : null

  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/*--------header------------*/}
    <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
      <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className="w-8 rounded-full" />
      <p className='flex-1 text-lg text-white flex items-center gap-2'>
        {selectedUser.fullName} 
        {onlineUsers.includes(String(selectedUser._id)) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
      </p>
       <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt=""
        className='md:hidden max-w-7' />
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
    </div>

    {/*--------chat area------------*/}
    <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6' > 
      {(messages || []).map((message,index) => {
        const senderId = message?.senderId ? String(message.senderId) : null
        const isOwnMessage = authUserId && senderId === authUserId

        return (
        <div key={message?._id || index} className={`flex items-end gap-2 justify-end ${!isOwnMessage ? 'flex-row-reverse' : ''}`}>
       {message.image ? (
        <img src={message.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
        ) : (
          <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-pink-600/30 text-white ${isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none'}`}>{message.text}</p>
          )}
          <div className="text-center-xs">
            <img src={isOwnMessage ? (authUser?.profilePic || assets.avatar_icon) : (selectedUser?.profilePic || assets.avatar_icon)} alt="" className='w-8 rounded-full' />
           <p className='text-gray-500'>{formatMessageTime(message.createdAt || Date.now())}</p>
           </div>
        </div>
        )
      })}

      <div ref={scrollEnd}></div>
    </div>

    {/*--------bottom area------------*/}

    <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
      <div className='flex-1 flex items-center bg-gray-700/60 p-3 rounded-full gap-2'>
      <input onChange={(e) => setInput(e.target.value)} value={input}   
      onKeyDown={(e) => e.key == "Enter" ? handleSendMessage(e) : null}
      type="text" placeholder="Send a message"
       className='flex-1 text-sm p-3 border-none rounded-lg outline-none bg-gray-600/40 text-white placeholder-gray-300 focus:ring-2 focus:ring-pink-600'/>
       <input onChange={handleImageSend} type="file" id='image' accept='image/png, image/jpeg' hidden/>
        <label htmlFor='image'>
          <img src={assets.gallery_icon} alt="" className="w-5 mr-2 cursor-pointer" />
        </label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} alt="send" className='w-7 cursor-pointer hover:bg-pink-500/20 p-1 rounded transition-colors' />
        </div>
    
          </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.myLogo || assets.logo_icon} alt="" className='max-w-24' />
      <p className='text-lg font-medium text-white'> Chat anytime, anywhere </p>
      
    </div>
  )
}

export default Chatcontainer
