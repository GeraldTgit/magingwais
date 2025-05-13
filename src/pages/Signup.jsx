import React, { useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Logo from "../images/logo.png";
import "../styles/Signup.css";

export default function Signup() {
  useEffect(() => {
    // Log environment variables (safely)
    console.log("Environment check:", {
      hasGoogleClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientIdLength: import.meta.env.VITE_GOOGLE_CLIENT_ID?.length,
      frontendUrl: window.location.origin,
    });
  }, []);

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      console.log("Google credential received:", {
        hasCredential: !!credentialResponse.credential,
        credentialLength: credentialResponse.credential?.length,
        type: credentialResponse.type,
      });

      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }

      const res = await axios.post(
        "https://magingwais-production.up.railway.app/api/auth/google",
        { token: credentialResponse.credential },
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          withCredentials: true,
        }
      );

      console.log("Authentication successful:", {
        status: res.status,
        hasUser: !!res.data.user,
        hasToken: !!res.data.token,
      });

      // Store user data
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      // Redirect
      window.location.href = "/search-lists";
    } catch (error) {
      console.error("Authentication failed:", {
        error: error.response?.data || error.message,
        status: error.response?.status,
        headers: error.response?.headers,
        credential: credentialResponse,
      });
      alert("Login failed. Please try again.");
    }
  };

  const handleGoogleLoginError = (error) => {
    console.error("Google login failed:", {
      error,
      type: error.type,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    alert("Google login failed. Please try again.");
  };

  return (
    <div className="page-container">
      <GoogleOAuthProvider 
        clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
        onScriptLoadSuccess={() => {
          console.log("Google Sign-In script loaded successfully", {
            timestamp: new Date().toISOString(),
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.slice(0, 10) + "...",
          });
        }}
        onScriptLoadError={(error) => {
          console.error("Google Sign-In script failed to load:", {
            error,
            timestamp: new Date().toISOString(),
          });
        }}
      >
        <div className="signup-card-container">
          <div className="logo-container">
            <img src={Logo} alt="Company Logo" className="company-logo" />
          </div>
          <div className="signup-wrapper">
            <h1>Sign Up</h1>
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              useOneTap
              auto_select
              context="signup"
              flow="implicit"
              ux_mode="popup"
            />
            <p className="p-em">Log in with Email (coming soon)</p>
          </div>
        </div>
      </GoogleOAuthProvider>
    </div>
  );   
}
