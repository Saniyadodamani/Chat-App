import { Navigate, Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster} from "react-hot-toast";
import { AuthContext} from '../context/AutoContext.jsx'
import { useContext } from "react";
import assets from "./assets/assets.js";
const { bgImage, myBackground } = assets;

const App = () => {
  const{ authUser}=useContext(AuthContext)
  return (
    <div
      className="min-h-screen w-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${myBackground})` }}
    >
      <Toaster />
      <Routes>
        <Route path="/" element={authUser? <Homepage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;