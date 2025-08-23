import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import authService from "../appwrite/auth";
import { login, logout } from "../features/userSlice";

export default function PrivateRoute({ children }) {
  const authStatus = useSelector((state) => state.user.isLoggedIn);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          dispatch(login(user));
        } else {
          dispatch(logout());
        }
      } catch (err) {
        console.error("Error in PrivateRoute:", err);
        dispatch(logout()); 
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [dispatch]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!authStatus) {
    return <Navigate to="/" replace />;
  }

  return children;
}
