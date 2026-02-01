import {createContext,  useEffect, useState, useCallback} from "react"
import axios, { AxiosHeaders } from 'axios';
import toast from "react-hot-toast"
import {io} from "socket.io-client"

const backendUrl=import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL= backendUrl;

export const AuthContext=createContext();

export const AuthProvider=({children})=>{

    const [token, setToken]=useState(localStorage.getItem("token"));
    const [authUser,setAuthUser]= useState(null);
    const [onlineUsers, setOnlineUsers]=useState([]);
    const [socket, setSocket ]= useState(null);
   
    const connectSocket = useCallback((userData)=>{
        if(!userData || socket?.connected) return;
        const newSocket=io(backendUrl, {
            query:{
                userId : userData._id,
            }
        })
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds)=>{
            setOnlineUsers(userIds);
        })
    }, [socket]);

    const checkAuth = useCallback(async() =>{
        try{
            const {data}=await axios.get("/api/auth/check");
            if(data.success){
                setAuthUser(data.user)
                connectSocket(data.user);
            }
        }catch(error){
            toast.error(error.message)
        }
    }, [connectSocket])


     const login =async(state, credentials)=>{
        try{
            const{ data}=await axios.post(`/api/auth/${state}`, credentials);
            if(data.success){
               setAuthUser(data.user);
               connectSocket(data.user);
               axios.defaults.headers.common["Authorization"]=`Bearer ${data.token}`;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message)
            }else{
                toast.error(data.message)
            }
        }  catch(error){
            toast.error(error.message)

        }
        }

  const logout=async()=>{
    localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["Authorization"]=null;
        toast.success("Logged out successfully")
        socket?.disconnect();
    
  }


     const updateProfile =async(body)=>{
        try{
            const{ data}=await axios.put("/api/auth/update-profile", body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
                        }
        } catch(error){
            toast.error(error.message)
        }
     }

    useEffect(()=>{
        if(token){
            axios.defaults.headers.common["Authorization"]=`Bearer ${token}`;
        }
    },[token])
    
    useEffect(()=>{
        if(token){
            checkAuth();
        }
    },[token, checkAuth])

    const value={
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        checkAuth

    }

    return (
        <AuthContext.Provider value={value} >
             {children}
        </AuthContext.Provider>
    )

}

   
    


    
