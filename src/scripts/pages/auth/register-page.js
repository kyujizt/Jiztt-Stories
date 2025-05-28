// src/scripts/pages/auth/register-page.js
import RegisterPresenter from "../../presenter/register-presenter.js";
import RegisterView from "./register-view.js";

export default class RegisterPage {
  constructor() {
    this.presenter = new RegisterPresenter({ view: RegisterView });
  }

  async render() {
    return `
      <section class="auth-form-section">
        <h1>Register</h1>
        <form id="register-form">
          <label for="name">Name:</label>
          <input type="text" id="name" name="name" required />
          
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required />
          
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required minlength="8" />
          
          <button type="submit">Register</button>
        </form>
        <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    this.presenter.init();
  }
}
