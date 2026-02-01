import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AutoContext';

const ProfilePage = () => {
  const { updateProfile, authUser } = useContext(AuthContext);
  const [selectedImg, setSelectedImg] = useState(null)
  const navigate = useNavigate()
  const [name, setName] = useState(authUser?.fullName || "")
  const [bio, setBio] = useState(authUser?.bio || "")

  useEffect(() => {
    if(authUser){
      setName(authUser.fullName || "")
      setBio(authUser.bio || "")
    }
  }, [authUser])

  const handleSubmit = async(e) => {
    e.preventDefault()
    if(selectedImg){
      const reader= new FileReader();
      reader.onload= async()=>{
         const base64Image= reader.result;
         await updateProfile({ profilePic : base64Image, fullName : name, bio});
         navigate('/');
      }
      reader.readAsDataURL(selectedImg);
    } else {
      await updateProfile({ fullName : name, bio});
      navigate('/');
    }
  }

  return(
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-pink-600 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg'>Profile Details</h3>
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input onChange={(e)=>setSelectedImg(e.target.files[0])} type="file" id='avatar' accept='.png,.jpg,.jpeg' hidden />
            <img src={selectedImg ? URL.createObjectURL(selectedImg) : (authUser?.profilePic || assets.myLogo || assets.logo_icon)} alt="" className={`w-12 h-12 ${selectedImg && 'rounded-full'}`}/>
            <span>upload profile image</span>
          </label>
          <input onChange={(e)=>setName(e.target.value)} value={name} type="text" className='p-2 border border-gray-500 rounded-md text-white bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700' placeholder='Enter your name'/>
          <textarea onChange={(e)=>setBio(e.target.value)} value={bio} placeholder="Write profile bio" required className="p-2 border border-gray-500 rounded-md text-white bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700" rows={4}></textarea>
          <button type="submit" className="bg-gradient-to-r from-pink-600 to-pink-800 text-white p-2 rounded-full text-lg cursor-pointer">Save</button>
        </form>
        <img className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImg && 'rounded-full'}`} src={selectedImg ? URL.createObjectURL(selectedImg) : (authUser?.profilePic || assets.myLogo || assets.logo_icon)} alt="" />
      </div>
    </div>
  );
}

export default ProfilePage
