export default class AuthModel {
  static async login(email, password) {
    try {
      const response = await fetch("https://story-api.dicoding.dev/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.message);
      localStorage.setItem("authToken", data.loginResult.token);
      return data;
    } catch (error) {
      throw new Error("Login gagal: " + error.message);
    }
  }

  static async register(userData) {
    try {
      const response = await fetch("https://story-api.dicoding.dev/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.message);
      return data;
    } catch (error) {
      throw new Error("Registrasi gagal: " + error.message);
    }
  }
}
