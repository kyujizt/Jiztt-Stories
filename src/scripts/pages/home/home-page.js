import HomePresenter from "../../presenter/home-presenter.js";
import HomeView from "./home-view.js";
import { registerServiceWorker } from "../../utils/push-helper.js";

export default class HomePage {
  constructor() {
    console.log("HomePresenter diinisialisasi dengan HomeView:");
    this.presenter = new HomePresenter({ view: HomeView });
  }

  async render() {
    return `
      <div class="skip-container">
        <a href="#story-list" class="skip-to-content" tabindex="0">
          Skip ke Konten Utama
        </a>
      </div>
      
      <main id="main-content" tabindex="-1">
        <section class="container">
          <div class="header-actions">
            <h1>Daftar Cerita</h1>
          </div>
          <div class="story-list" id="story-list">
            <p>Memuat cerita...</p>
          </div>
          <div id="story-modal" class="modal"></div>
        </section>
      </main>
    `;
  }

  async afterRender() {
    try {
      console.log("🔄 Memulai inisialisasi halaman...");
      
      // Register service worker for notifications
      await registerServiceWorker();
      
      // Initialize presenter
      await this.presenter.init();

      // Ambil data cerita
      const stories = await this.presenter.getStories();

      // Tampilkan cerita ke view dan inisialisasi tombol offline
      await HomeView.showStories(stories);
      HomeView.initializeSaveOfflineButtons(stories);

      // Setup event handler untuk detail cerita
      const onDetailClick = async (storyId) => {
        try {
          console.log("🔄 Memuat detail cerita dengan ID:", storyId);
          await this.presenter.fetchAndShowDetail(storyId);
        } catch (error) {
          console.error("❌ Gagal memuat detail cerita:", error.message);
        }
      };

      // Setup event listener untuk klik cerita
      document.querySelectorAll('.story-item').forEach(item => {
        item.addEventListener('click', (e) => {
          // Jangan trigger jika yang diklik adalah tombol
          if (!e.target.closest('.story-actions')) {
            const storyId = item.dataset.id;
            onDetailClick(storyId);
          }
        });
      });
    } catch (error) {
      console.error("❌ Error pada afterRender:", error.message);
      HomeView.showError("Terjadi kesalahan saat memuat halaman. Silakan coba lagi.");
    }
  }
}