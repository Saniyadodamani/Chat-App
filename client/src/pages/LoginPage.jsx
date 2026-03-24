import React, { useState, useContext } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AutoContext'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (!isAgreed) {
      toast.error("Please agree to the terms of use first.");
      return;
    }

    if (currState === 'Sign up') {
      if (!isDataSubmitted) {
        if (!fullName || !email || !password) {
          toast.error("Please fill in all fields");
          return;
        }
        setIsDataSubmitted(true);
        return;
      }
      // Second step - submit with bio
      const loginCredentials = { fullName, email, password, bio };
      login('signup', loginCredentials);
    } else {
      // Login
      const loginCredentials = { email, password };
      login('login', loginCredentials);
    }
  };

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
      <img src={assets.myLogo || assets.logo_big} alt="" className='w-[min(30vw,250px)]' />
      <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currState}
          {isDataSubmitted && (<img onClick={() => setIsDataSubmitted(false)} src={assets.arrow_icon} alt="" className='w-5 cursor-pointer' />)}
        </h2>

        {currState === 'Sign up' && !isDataSubmitted && (
          <>
            <input onChange={(e) => setFullName(e.target.value)} value={fullName} type="text" className='p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600' placeholder='Full Name' required />
            <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder='Email' required className='p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600' />
            <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder='Password' required className='p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600' />
          </>
        )}

        {currState === 'Sign up' && isDataSubmitted && (
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} rows={4} className='p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600' placeholder='provide a short bio...' required></textarea>
        )}

        {currState === 'Login' && (
          <>
            <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder='Email' required className='p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600' />
            <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder='Password' required className='p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600' />
          </>
        )}

        <button
          type='submit'
          disabled={!isAgreed}
          className={`py-3 bg-gradient-to-r from-pink-600 to-pink-800 text-white rounded-md cursor-pointer transition-opacity ${!isAgreed ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        >
          {currState === 'Sign up' ? "Create Account" : "Login Now"}
        </button>

        <div className='flex items-center gap-2'>
          <input
            type="checkbox"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            className='w-4 h-4 rounded border-gray-600 bg-gray-700 text-pink-600 focus:ring-pink-600'
          />
          <p className='text-sm text-gray-300'>Agree to the terms of use and privacy policy.</p>
        </div>

        <div className='flex flex-col gap-2'>
          {currState === "Sign up" ? (
            <p className='text-sm text-gray-600'>Already have an account? <span onClick={() => setCurrState("Login")} className='font-medium text-pink-600 cursor-pointer'>Login here</span></p>
          ) : (
            <p className='text-sm text-gray-600'>Create an account <span onClick={() => setCurrState("Sign up")} className='font-medium text-pink-600 cursor-pointer'>Click here</span></p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage

