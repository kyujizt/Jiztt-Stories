import AboutView from "./about-view";

export default class AboutPage {
  async render() {
    return `
      <div class="skip-container">
        <a href="#about-content" class="skip-to-content" tabindex="0">
          Skip ke Konten Utama
        </a>
      </div>

      <main id="about-content" tabindex="-1">
        ${AboutView.renderContent()}
      </main>
    `;
  }

  async afterRender() {
    AboutView.setupMap();
    AboutView.setupSkipToContent();
  }
}
