const RegisterView = {
  setupRegisterForm(callback) {
    const form = document.querySelector("#register-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.querySelector("#name").value;
      const email = document.querySelector("#email").value;
      const password = document.querySelector("#password").value;
      callback({ name, email, password });
    });
  },

  showError(message) {
    document.querySelector(".error-message").textContent = message;
  },

  redirectToLogin() {
    window.location.hash = "/login";
  },
};

export default RegisterView;
