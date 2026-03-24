import React, { useContext } from 'react'
import Sidebar from "../components/Sidebar"
import Chatcontainer from "../components/Chatcontainer"
import Rightsidebar from "../components/Rightsidebar"
import { ChatContext } from '../../context/ChatContext'

const Homepage = () => {
  const { selectedUser, showRightPanel } = useContext(ChatContext)

  return (
    <div className='border w-full h-screen sm:px-[15%] sm:py-[5%]'>
  <div
    className={`
      backdrop-blur-xl
      border-2 border-gray-600
      rounded-2xl
      overflow-hidden
      h-[100%]
      grid grid-cols-1 relative
      ${selectedUser && showRightPanel
        ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]'
        : selectedUser
        ? 'md:grid-cols-[1fr_2fr]'
        : 'md:grid-cols-2'}
    `}
  >
        <Sidebar />
        <Chatcontainer/>
        {selectedUser && showRightPanel && <Rightsidebar />}
      </div>
    </div>
  );
};

export default Homepage;