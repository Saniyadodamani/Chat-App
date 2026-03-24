import React, { useRef, useEffect, useState, useContext } from 'react'
import ReactDOM from 'react-dom'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AutoContext'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'

const Chatcontainer = () => {

  const {
    messages, selectedUser, setSelectedUser, sendMessage, getMessages, deleteMessage,
    isTyping, emitTyping, emitStopTyping,
    showRightPanel, setShowRightPanel
  } = useContext(ChatContext)
  const { onlineUsers, authUser } = useContext(AuthContext)

  const scrollEnd = useRef()
  const typingTimeoutRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const contextMenuRef = useRef(null)
  const emojiPickerRef = useRef(null)

  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingIntervalRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null) // {x, y, messageId}

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (input.trim() === '') return
    const text = input.trim()
    setInput('')
    emitStopTyping()
    await sendMessage({ text })
  }

  const handleImageSend = async (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Select an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      await sendMessage({ image: reader.result })
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    emitTyping()
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping()
    }, 1500)
  }

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji)
    setShowEmoji(false)
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        const reader = new FileReader()
        reader.onload = async () => {
          await sendMessage({ voice: reader.result })
        }
        reader.readAsDataURL(audioBlob)
        setRecordingTime(0)
        clearInterval(recordingIntervalRef.current)
      }

      mediaRecorder.start()
      setIsRecording(true)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Right-click context menu for delete
  const handleContextMenu = (e, message) => {
    e.preventDefault()
    e.stopPropagation()
    const authUserId = authUser?._id ? String(authUser._id) : null
    const msgSenderId = String(message.senderId)
    if (msgSenderId !== authUserId) return
    if (message.deleted) return
    setContextMenu({ x: e.clientX, y: e.clientY, messageId: message._id })
  }

  const handleDelete = async () => {
    if (contextMenu) {
      await deleteMessage(contextMenu.messageId)
      setContextMenu(null)
    }
  }

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id)
    }
  }, [selectedUser, getMessages])

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // Close emoji & context menu ONLY when clicking OUTSIDE them
  useEffect(() => {
    const handler = (e) => {
      // Close emoji picker only if click is outside the picker AND the emoji button
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmoji(false)
      }
      // Close context menu only if clicking outside the menu itself
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])


  const authUserId = authUser?._id ? String(authUser._id) : null

  const isOnline = selectedUser && onlineUsers.includes(String(selectedUser._id))

  const formatSeconds = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return selectedUser ? (
    <>
      <div className='h-full overflow-hidden flex flex-col relative backdrop-blur-lg'>
      {/*-------- header --------*/}
      <div
        className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500 cursor-pointer'
        onClick={() => setShowRightPanel((v) => !v)}
        title='View profile'
      >
        <img src={selectedUser?.profilePic || assets.avatar_icon} alt='' className='w-8 rounded-full' />
        <div className='flex-1'>
          <p className='text-lg text-white flex items-center gap-2'>
            {selectedUser.fullName}
            {isOnline && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
          </p>
          <p className='text-xs text-gray-400'>
            {isTyping ? (
              <span className='text-green-400 animate-pulse'>typing...</span>
            ) : isOnline ? (
              'Online'
            ) : (
              'Offline'
            )}
          </p>
        </div>
        <img
          onClick={(e) => { e.stopPropagation(); setSelectedUser(null) }}
          src={assets.arrow_icon} alt=''
          className='md:hidden max-w-7'
        />
        <img src={assets.help_icon} alt='' className='max-md:hidden max-w-5 opacity-60' />
      </div>

      {/*-------- chat area --------*/}
      <div className='flex-1 overflow-y-scroll p-3 pb-2'>
        {(messages || []).map((message, index) => {
          const senderId = message?.senderId ? String(message.senderId) : null
          const isOwnMessage = authUserId && senderId === authUserId

          return (
            <div
              key={message?._id || index}
              className={`flex items-end gap-2 justify-end mb-3 ${!isOwnMessage ? 'flex-row-reverse' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, message)}
            >
              {/* avatar + time */}
              <div className='text-center shrink-0'>
                <img
                  src={isOwnMessage ? (authUser?.profilePic || assets.avatar_icon) : (selectedUser?.profilePic || assets.avatar_icon)}
                  alt='' className='w-7 rounded-full'
                />
                <p className='text-gray-500 text-[10px] mt-1'>{formatMessageTime(message.createdAt || Date.now())}</p>
              </div>

              {/* bubble */}
              <div 
                className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} cursor-pointer`}
                onContextMenu={(e) => handleContextMenu(e, message)}
              >
                {message.deleted ? (
                  <p className='text-gray-500 italic text-xs px-3 py-2 bg-white/5 rounded-lg'>
                    🚫 This message was deleted
                  </p>
                ) : message.voice ? (
                  <div className={`px-3 py-2 rounded-lg max-w-[220px] ${isOwnMessage ? 'bg-pink-600/40 rounded-br-none' : 'bg-white/10 rounded-bl-none'}`}>
                    <audio controls src={message.voice} className='w-48 h-8' />
                  </div>
                ) : message.image ? (
                  <img src={message.image} alt='' className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden' />
                ) : (
                  <p 
                    className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg break-all ${isOwnMessage ? 'bg-pink-600/30 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}
                  >
                    {message.text}
                  </p>
                )}

                {/* Read receipt (tick) — only for own messages */}
                {isOwnMessage && !message.deleted && (
                  <span className={`text-[10px] mt-0.5 ${message.seen ? 'text-blue-400' : 'text-gray-500'}`}>
                    {message.seen ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className='flex items-end gap-2 flex-row-reverse mb-3'>
            <img src={selectedUser?.profilePic || assets.avatar_icon} alt='' className='w-7 rounded-full' />
            <div className='bg-white/10 text-white rounded-lg rounded-bl-none px-4 py-2 flex gap-1 items-center'>
              <span className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
              <span className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
              <span className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        <div ref={scrollEnd}></div>
      </div>

      {/*-------- bottom input area --------*/}
      <div className='px-3 py-2 flex items-center gap-2 relative'>
        {/* Emoji picker */}
        {showEmoji && (
          <div ref={emojiPickerRef} className='absolute bottom-16 left-3 z-50'>
            <EmojiPicker onEmojiClick={onEmojiClick} theme='dark' height={350} width={300} />
          </div>
        )}

        <div className='flex-1 flex items-center bg-gray-700/60 p-2 rounded-full gap-2'>
          {/* Emoji button */}
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); setShowEmoji((v) => !v) }}
            className='text-xl px-1 cursor-pointer hover:scale-110 transition-transform select-none'
            title='Emoji'
          >
            😊
          </button>

          <input
            onChange={handleInputChange}
            value={input}
            onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(e) : null}
            type='text'
            placeholder='Send a message'
            className='flex-1 text-sm px-2 py-2 border-none rounded-lg outline-none bg-transparent text-white placeholder-gray-300 focus:ring-0'
          />

          {/* Image upload */}
          <input onChange={handleImageSend} type='file' id='image' accept='image/png, image/jpeg' hidden />
          <label htmlFor='image' className='cursor-pointer'>
            <img src={assets.gallery_icon} alt='' className='w-5 mr-1 opacity-80 hover:opacity-100 transition-opacity' />
          </label>
        </div>

        {/* Voice record / Send */}
        {input.trim() ? (
          <button
            onClick={handleSendMessage}
            className='w-9 h-9 flex items-center justify-center bg-pink-600 hover:bg-pink-700 rounded-full cursor-pointer transition-colors shrink-0'
          >
            <img src={assets.send_button} alt='send' className='w-5' />
          </button>
        ) : isRecording ? (
          <button
            onClick={stopRecording}
            className='flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-full cursor-pointer transition-colors shrink-0'
            title='Stop recording'
          >
            ⏹ {formatSeconds(recordingTime)}
          </button>
        ) : (
          <button
            onClick={startRecording}
            className='w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-pink-600 rounded-full cursor-pointer transition-colors shrink-0'
            title='Record voice message'
          >
            🎤
          </button>
        )}
      </div>
    </div>

      {/* Context menu via Portal — escapes backdrop-blur stacking context */}
      {contextMenu && ReactDOM.createPortal(
        <div
          ref={contextMenuRef}
          style={{ 
            position: 'fixed',
            top: contextMenu.y, 
            left: contextMenu.x,
            zIndex: 9999,
            background: '#1a1a2e',
            border: '1px solid rgba(219,39,119,0.4)',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            minWidth: '160px',
            display: 'flex',
            flexDirection: 'column',
            fontSize: '14px',
            color: 'white',
          }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button
            onMouseDown={(e) => { e.stopPropagation(); handleDelete(); }}
            style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 20px', background:'none', border:'none', color:'#f87171', cursor:'pointer', textAlign:'left', width:'100%' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background='none'}
          >
            🗑 Delete message
          </button>
          <button
            onMouseDown={(e) => { e.stopPropagation(); setContextMenu(null); }}
            style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 20px', background:'none', border:'none', borderTop:'1px solid #374151', color:'#9ca3af', cursor:'pointer', textAlign:'left', width:'100%' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background='none'}
          >
            ✕ Cancel
          </button>
        </div>,
        document.body
      )}
    </>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.myLogo || assets.logo_icon} alt='' className='max-w-24' />
      <p className='text-lg font-medium text-white'> Chat anytime, anywhere </p>
    </div>
  )
}

export default Chatcontainer
