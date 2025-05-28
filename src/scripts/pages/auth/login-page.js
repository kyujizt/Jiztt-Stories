import LoginPresenter from "../../presenter/login-presenter.js";
import LoginView from "./login-view.js";

export default class LoginPage {
  constructor() {
    this.presenter = new LoginPresenter({ view: LoginView });
  }

  async render() {
    return `
      <!-- Skip to Content -->
      <a href="#main-content" class="skip-to-content" tabindex="1" aria-label="Skip to main content">Skip to Content</a>

      <main id="main-content" class="auth-form-section" tabindex="-1" role="main">
        <h1>Login</h1>
        <form id="login-form">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required>

          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required>

          <button type="submit">Login</button>
        </form>
        <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
      </main>
    `;
  }

  async afterRender() {
    this.presenter.init();

    const skipLink = document.querySelector(".skip-to-content");
    const mainContent = document.querySelector("#main-content");

    skipLink.addEventListener("click", function (event) {
      event.preventDefault();
      skipLink.blur();
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
    });
  }
}
