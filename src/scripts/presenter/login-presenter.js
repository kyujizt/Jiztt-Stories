import AuthModel from "../data/login-auth";

export default class LoginPresenter {
  constructor({ view }) {
    this.view = view;
  }

  init() {
    console.log("🔄 Menghubungkan View dan Model untuk login...");
    this.view.setupLoginForm((email, password) => this.handleLogin(email, password));
  }

  async handleLogin(email, password) {
    try {
      console.log("📡 Mengirim data login...");
      await AuthModel.login(email, password);
      this.view.redirectToHome();
    } catch (error) {
      console.error("❌ Gagal login:", error.message);
      this.view.showError("Terjadi kesalahan. Silakan coba lagi.");
    }
  }
}
