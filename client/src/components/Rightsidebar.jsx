import React, { useContext, useState, useEffect } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AutoContext'

const Rightsidebar = () => {

  const { selectedUser, messages, setShowRightPanel } = useContext(ChatContext)
  const { logout, onlineUsers } = useContext(AuthContext)
  const [msgImages, setMsgImages] = useState([])
  const [lightboxSrc, setLightboxSrc] = useState(null) // for both profile pic and media
  const [mediaOpen, setMediaOpen] = useState(false)

  useEffect(() => {
    const imgs = (messages || []).filter((msg) => msg?.image && !msg?.deleted).map((msg) => msg.image)
    setMsgImages(imgs)
  }, [messages])

  if (!selectedUser) return null

  const isOnline = onlineUsers.includes(String(selectedUser._id))

  return (
    <>
      <div className='bg-[#8185B2]/10 text-white w-full relative flex flex-col overflow-y-auto'>
        {/* Close button */}
        <button
          onClick={() => setShowRightPanel(false)}
          className='absolute top-3 right-3 text-gray-400 hover:text-white text-lg transition-colors z-10'
          title='Close'
        >
          ✕
        </button>

        {/* Profile section */}
        <div className='pt-12 flex flex-col items-center gap-2 px-4'>
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=''
            onClick={() => setLightboxSrc(selectedUser?.profilePic || assets.avatar_icon)}
            className='w-28 aspect-square rounded-full border-2 border-pink-600/50 cursor-pointer hover:opacity-90 transition-opacity'
            title='View profile photo'
          />
          <h1 className='text-base font-semibold flex items-center gap-2 text-center'>
            {isOnline && <span className='w-2 h-2 rounded-full bg-green-500 shrink-0'></span>}
            {selectedUser.fullName}
          </h1>
          <p className={`text-xs font-light ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        <hr className='border-[#ffffff20] my-4 mx-4' />

        {/* Media section */}
        <div className='px-4 flex-1'>
          <button
            onClick={() => setMediaOpen((v) => !v)}
            className='flex justify-between items-center w-full text-sm font-medium text-gray-200 hover:text-white transition-colors'
          >
            <span>📷 Media</span>
            <span className='text-gray-400 text-xs'>{msgImages.length} {mediaOpen ? '▲' : '▼'}</span>
          </button>

          {mediaOpen && (
            <div className='mt-3 grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto'>
              {msgImages.length === 0 ? (
                <p className='text-gray-500 text-xs col-span-2'>No media shared yet</p>
              ) : msgImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => setLightboxSrc(url)}
                  className='cursor-pointer rounded-lg overflow-hidden hover:ring-2 hover:ring-pink-500 transition-all'
                >
                  <img src={url} alt='' className='w-full h-20 object-cover' />
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className='border-[#ffffff20] my-4 mx-4' />

        {/* Logout */}
        <div className='px-4 pb-6'>
          <button
            onClick={() => logout()}
            className='w-full bg-gradient-to-r from-pink-600 to-pink-800 text-white text-sm py-2 px-4 rounded-full cursor-pointer hover:opacity-90 transition-opacity'
          >
            Logout
          </button>
        </div>
      </div>

      {/* Lightbox (profile pic or media) */}
      {lightboxSrc && (
        <div
          className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center'
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className='absolute top-4 right-5 text-white text-3xl hover:text-gray-300 transition-colors'
          >
            ✕
          </button>
          <img
            src={lightboxSrc}
            alt=''
            onClick={(e) => e.stopPropagation()}
            className='max-w-[90vw] max-h-[90vh] rounded-xl object-contain shadow-2xl'
          />
        </div>
      )}
    </>
  )
}

export default Rightsidebar
