const LoginView = {
  setupLoginForm(callback) {
    const form = document.querySelector("#login-form");
    if (!form) {
      console.error("Login form not found in the DOM");
      return;
    }
    
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = document.querySelector("#email").value;
      const password = document.querySelector("#password").value;
      callback(email, password);
    });
  },

  showError(message) {
    // Check if error element exists
    let errorElement = document.querySelector(".error-message");
    
    // If it doesn't exist, create it
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "error-message";
      errorElement.style.color = "red";
      errorElement.style.marginTop = "10px";
      errorElement.style.marginBottom = "10px";
      
      // Find the login form to insert the error message
      const form = document.querySelector("#login-form");
      if (form) {
        // Insert before the form's first child (usually the first input field)
        form.insertBefore(errorElement, form.firstChild);
      } else {
        // If form doesn't exist, add to body
        document.body.appendChild(errorElement);
      }
    }
    
    // Set the error message
    errorElement.textContent = message;
    errorElement.style.display = "block";
  },

  hideError() {
    const errorElement = document.querySelector(".error-message");
    if (errorElement) {
      errorElement.style.display = "none";
    }
  },

  redirectToHome() {
    window.location.hash = "/home";
  },
};

export default LoginView;
