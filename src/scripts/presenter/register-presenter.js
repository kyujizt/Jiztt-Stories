import AuthModel from "../data/login-auth";

export default class RegisterPresenter {
  constructor({ view }) {
    this.view = view;
  }

  init() {
    this.view.setupRegisterForm((userData) => this.handleRegister(userData));
  }

  async handleRegister(userData) {
    try {
      await AuthModel.register(userData);
      alert("Registrasi berhasil! Silakan login.");
      this.view.redirectToLogin();
    } catch (error) {
      console.error("❌ Gagal registrasi:", error.message);
      this.view.showError(error.message);
    }
  }
}
