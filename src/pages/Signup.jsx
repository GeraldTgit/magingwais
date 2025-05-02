import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Logo from "../images/logo.png";
import "./Signup.css";

export default function Signup() {
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      console.log("Google credential received:", credentialResponse);

      const res = await axios.post(
        "http://localhost:4000/api/auth/google/",
        { token: credentialResponse.credential },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Authentication successful:", res.data);

      // Store user data
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      // Redirect
      window.location.href = "/search-items";
    } catch (error) {
      console.error("Authentication failed:", {
        error: error.response?.data || error.message,
        credential: credentialResponse, // For debugging
      });
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <div className="card-container">
          <div className="logo-container">
            <img src={Logo} alt="Company Logo" className="company-logo" />
          </div>
          <div className="signup-wrapper">
            <h1>Sign Up</h1>
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => {
                console.error("Google login failed");
                alert("Google login failed. Please try again.");
              }}
              useOneTap
              auto_select
            />
            <p className="p-em">Log in with Email (coming soon)</p>
          </div>
        </div>
      </GoogleOAuthProvider>
    </div>
  );   
}
