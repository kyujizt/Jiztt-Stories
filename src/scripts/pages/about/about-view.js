import L from "leaflet";

const AboutView = {
  renderContent() {
    return `
      <section class="container">
        <h1>About Page</h1>
        <a href="#" id="skip-link" class="skip-to-content" tabindex="1" aria-label="Skip to main content">Skip to Content</a>

        <div class="story-item">
          <h3>Tentang :</h3>
          <p>
            Aplikasi ini merupakan Single Page Application (SPA) berbasis JavaScript yang memungkinkan pengguna untuk menambahkan cerita (story) lengkap dengan gambar dan lokasi secara interaktif.
          </p>
          <ul>
            <li>Semangatt yahhh!</li>
          </ul>

          <p>🗺️ Di bawah ini adalah peta interaktif yang dapat Anda geser dan zoom untuk melihat lokasi.</p>
          <div id="map" style="height: 400px; margin-top: 1rem;"></div>
        </div>
      </section>
    `;
  },

  setupMap() {
    const map = L.map("map").setView([51.505, -0.09], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  },

  setupSkipToContent() {
    const mainContent = document.querySelector("#main-content");
    const skipLink = document.querySelector("#skip-link");

    if (skipLink) {
      skipLink.addEventListener("click", function (event) {
        event.preventDefault();
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: "smooth" });
      });
    }
  },
};

export default AboutView;
