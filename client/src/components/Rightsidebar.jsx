import React, { useContext, useState, useEffect } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AutoContext'

const Rightsidebar = () => {

  const { selectedUser, messages } = useContext(ChatContext)
  const { logout, onlineUsers } = useContext(AuthContext)
  const [msgImages, setMsgImages]= useState([])

  useEffect(()=>{
    const imgs = (messages || []).filter((msg)=> msg?.image).map((msg)=> msg.image)
    setMsgImages(imgs)
  }, [messages])

  return selectedUser ? (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll`}>
        <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
          <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-40 aspect-[1/1]
          rounded-full' />
          <h1 className='px-10 text-x1 font-medium mx-auto flex items-center gap-2'>
            {onlineUsers.includes(String(selectedUser._id)) && <p className='w-2 h-2 rounded-full bg-green-500'></p>}
            {selectedUser.fullName}
          </h1>
          <p className='px-10 mx-auto'>{selectedUser?.bio}</p>

        </div>


        <hr className="border-[#ffffff50] my-4" />

        <div className="px-5 text-xs">
          <p>Media</p>
          <div className='mt-2 max-h-[200px] overflow-y-scroll grid gap-4 opacity-80'>
            {msgImages.length === 0 ? (
              <p className='text-gray-400'>No media</p>
            ) : msgImages.map((url,index)=>(
              <div key={index} onClick={()=>window.open(url)} className='cursor-pointer rounded'>
                <img src={url} alt="" className='h-full rounded-md' />
              </div>
            ))}
          </div>
        </div>
    <div>
      <button onClick={()=>logout()} className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-600 to-pink-800 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer'>
        Logout 
      </button>
    </div>
    </div>
  ) : null
}

export default Rightsidebar
