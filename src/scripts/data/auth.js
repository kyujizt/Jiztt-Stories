// src/scripts/data/auth.js
import CONFIG from "../config";

const ENDPOINTS = {
  LOGIN: `${CONFIG.BASE_URL}/login`,
};

export async function loginUser(email, password) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Login gagal");
    }

    // Simpan token ke localStorage
    localStorage.setItem("authToken", result.loginResult.token);
    return result.loginResult;
  } catch (error) {
    console.error("Login error:", error.message);
    return null;
  }
}
