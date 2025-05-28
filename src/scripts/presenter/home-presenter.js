import { getData, getDataById } from "../data/api";
import { saveStory, getStories, deleteStory, isStorySaved } from "../utils/indexDB";
import { 
  isUserSubscribed, 
  simulatePushNotification, 
  updateNotifButton,
  initializeNotificationButton 
} from "../utils/push-helper";

export default class HomePresenter {
  constructor({ view }) {
    this.view = view;
    this.lastNotificationCheck = null;
    this.storiesCache = null;
  }

  async init() {
    try {
      console.log("🔄 Memulai inisialisasi HomePresenter...");
      
      // Initialize notification button jika ada
      await this.initializeNotifications();
      
      console.log("🔄 Memulai pengambilan cerita...");
      const stories = await this.getStories();

      if (!stories || stories.length === 0) {
        this.view.showError("Tidak ada cerita yang tersedia.");
        return;
      }

      this.view.showStories(stories);
      this._setupStoryClickEvent(stories);
      
      // Update cache
      this.storiesCache = stories;
      
      console.log("✅ Cerita berhasil dimuat.");
    } catch (error) {
      console.error("❌ Error saat memuat cerita:", error.message);
      this.view.showError("Gagal memuat cerita. Silakan coba lagi nanti.");
    }
  }

  async initializeNotifications() {
    try {
      // Pastikan notification button terinisialisasi dengan benar
      if (typeof initializeNotificationButton === 'function') {
        await initializeNotificationButton();
      }
      
      // Update button state berdasarkan status subscription saat ini
      const isSubscribed = await isUserSubscribed();
      updateNotifButton(isSubscribed);
      
      console.log(`✅ Notification initialized: isSubscribed=${isSubscribed}`);
    } catch (error) {
      console.warn("⚠️ Gagal inisialisasi notification:", error.message);
    }
  }

  async fetchAndShowDetail(storyId) {
    try {
      console.log(`🔄 Mengambil detail cerita dengan ID: ${storyId}`);
      const story = await getDataById(storyId);

      if (!story) {
        throw new Error("Cerita tidak ditemukan");
      }

      // Validasi lokasi
      if (!story.location || 
          typeof story.location.lat !== "number" || 
          typeof story.location.lng !== "number") {
        console.warn(`⚠️ Cerita dengan ID ${storyId} tidak memiliki lokasi valid.`);
        // Set default location jika tidak ada
        story.location = {
          lat: 0,
          lng: 0
        };
      }

      // Pastikan createdAt ada
      story.createdAt = story.createdAt || new Date().toISOString();
      
      this.view.showStoryDetail(story);
      console.log("✅ Detail cerita berhasil dimuat.");

      // Update last viewed story untuk notification tracking
      this.updateLastViewedStory(storyId);
      
    } catch (error) {
      console.error("❌ Error saat memuat detail cerita:", error.message);
      this.view.showError("Gagal memuat detail cerita.");
    }
  }

  async getStories() {
    try {
      console.log("📡 Mengambil daftar cerita...");
      const stories = await getData();

      if (!stories || stories.length === 0) {
        console.warn("❌ Tidak ada cerita yang tersedia dari API.");
        return await this.getOfflineStories();
      }

      // Process stories
      const processedStories = stories.map((story) => ({
        ...story,
        createdAt: story.createdAt || new Date().toISOString(),
      }));

      // Check untuk notifikasi cerita baru (dengan debouncing)
      await this.checkForNewStoryNotification(processedStories);

      return processedStories;
      
    } catch (error) {
      console.warn("⚠️ Gagal mengambil dari API, mencoba IndexedDB...", error.message);
      return await this.getOfflineStories();
    }
  }

  async getOfflineStories() {
    try {
      const offlineStories = await getStories();
      if (!offlineStories || offlineStories.length === 0) {
        console.error("❌ Tidak ada data tersimpan di IndexedDB.");
        this.view.showError("Tidak ada data offline yang tersedia.");
        return [];
      }
      
      console.log("✅ Data offline berhasil dimuat.");
      return offlineStories.map(story => ({
        ...story,
        createdAt: story.createdAt || new Date().toISOString(),
      }));
    } catch (dbError) {
      console.error("❌ Gagal mengambil data offline:", dbError);
      this.view.showError("Terjadi kesalahan saat mengambil data offline.");
      return [];
    }
  }

  async checkForNewStoryNotification(stories) {
    try {
      // Debouncing - hanya check jika sudah lewat 30 detik dari check terakhir
      const now = Date.now();
      if (this.lastNotificationCheck && (now - this.lastNotificationCheck) < 30000) {
        console.log("Notification check skipped - too soon");
        return;
      }
      this.lastNotificationCheck = now;

      // Check subscription status dengan konsistensi
      const isSubscribed = await isUserSubscribed();
      
      if (!isSubscribed || stories.length === 0) {
        console.log("Notification skipped - not subscribed or no stories");
        return;
      }

      const lastViewedStoryId = localStorage.getItem('lastViewedStoryId');
      const newestStory = stories[0]; // Assuming stories are sorted by date (newest first)

      // Hanya kirim notifikasi jika ada story baru dan bukan pertama kali load
      if (lastViewedStoryId && 
          lastViewedStoryId !== newestStory.id && 
          this.storiesCache && // Pastikan bukan first load
          this.storiesCache.length > 0) {
        
        console.log("📢 Mengirim notifikasi cerita baru");
        
        // Tambahkan delay untuk memastikan tidak duplicate
        setTimeout(async () => {
          await simulatePushNotification(
            'Cerita Baru Tersedia',
            `${newestStory.name || 'Seseorang'} baru saja membagikan cerita`,
            '/',
            newestStory.photoUrl
          );
        }, 500);
      }

      // Update last viewed story ID
      localStorage.setItem('lastViewedStoryId', newestStory.id);
      
    } catch (error) {
      console.error("❌ Error checking new story notification:", error.message);
    }
  }

  updateLastViewedStory(storyId) {
    try {
      localStorage.setItem('lastViewedStoryId', storyId);
      console.log(`📝 Updated last viewed story: ${storyId}`);
    } catch (error) {
      console.warn("⚠️ Gagal update last viewed story:", error.message);
    }
  }

  async saveStoryOffline(storyId) {
    try {
      console.log(`🔄 Menyimpan cerita dengan ID: ${storyId} ke offline`);

      // Check if already saved
      const alreadySaved = await isStorySaved(storyId);
      if (alreadySaved) {
        console.log(`✅ Cerita dengan ID: ${storyId} sudah tersimpan sebelumnya`);
        
        // Still show notification if user is subscribed (with delay to prevent duplicate)
        const isSubscribed = await isUserSubscribed();
        if (isSubscribed) {
          setTimeout(async () => {
            await simulatePushNotification(
              'Cerita Sudah Tersimpan',
              'Cerita ini sudah tersimpan untuk dibaca offline',
              '/#/offline'
            );
          }, 300);
        }
        return true;
      }

      // Get story data
      const story = await getDataById(storyId);
      if (!story) {
        throw new Error("Cerita tidak ditemukan");
      }

      // Save story
      const result = await saveStory(story);
      if (!result) {
        throw new Error("Gagal menyimpan cerita ke database");
      }

      console.log("✅ Cerita berhasil disimpan offline");

      // Send notification if subscribed (with delay to prevent duplicate)
      const isSubscribed = await isUserSubscribed();
      if (isSubscribed) {
        setTimeout(async () => {
          await simulatePushNotification(
            'Cerita Disimpan',
            'Cerita berhasil disimpan untuk dibaca offline',
            '/#/offline'
          );
        }, 300);
      }

      return true;
      
    } catch (error) {
      console.error("❌ Error saat menyimpan cerita offline:", error.message);
      
      // Show error notification if subscribed (with delay)
      const isSubscribed = await isUserSubscribed();
      if (isSubscribed) {
        setTimeout(async () => {
          await simulatePushNotification(
            'Gagal Menyimpan',
            'Terjadi kesalahan saat menyimpan cerita offline',
            '/'
          );
        }, 300);
      }
      
      return false;
    }
  }

  async deleteStoryOffline(storyId) {
    try {
      console.log(`🔄 Menghapus cerita dengan ID: ${storyId} dari offline`);

      const result = await deleteStory(storyId);
      if (!result) {
        throw new Error("Gagal menghapus cerita dari database");
      }

      console.log("✅ Cerita berhasil dihapus dari offline");

      // Send notification if subscribed
      const isSubscribed = await isUserSubscribed();
      if (isSubscribed) {
        await simulatePushNotification(
          'Cerita Dihapus',
          'Cerita berhasil dihapus dari penyimpanan offline',
          '/#/offline'
        );
      }

      return true;
      
    } catch (error) {
      console.error("❌ Error saat menghapus cerita offline:", error.message);
      return false;
    }
  }

  // Method untuk refresh stories dan check notification
  async refreshStories() {
    try {
      console.log("🔄 Refresh stories...");
      const stories = await this.getStories();
      
      if (stories && stories.length > 0) {
        this.view.showStories(stories);
        this._setupStoryClickEvent(stories);
        this.storiesCache = stories;
        console.log("✅ Stories berhasil di-refresh");
      }
      
      return stories;
    } catch (error) {
      console.error("❌ Error refresh stories:", error.message);
      return [];
    }
  }

  // Method untuk update notification status
  async updateNotificationStatus() {
    try {
      const isSubscribed = await isUserSubscribed();
      updateNotifButton(isSubscribed);
      console.log(`📱 Notification status updated: ${isSubscribed}`);
      return isSubscribed;
    } catch (error) {
      console.error("❌ Error updating notification status:", error.message);
      return false;
    }
  }

  _setupStoryClickEvent(stories) {
    if (this.view && typeof this.view._setupStoryClickEvent === 'function') {
      this.view._setupStoryClickEvent(stories, (id) => this.fetchAndShowDetail(id));
    } else {
      console.warn("⚠️ View._setupStoryClickEvent method not found");
    }
  }

  // Cleanup method
  destroy() {
    this.storiesCache = null;
    this.lastNotificationCheck = null;
    console.log("🧹 HomePresenter destroyed");
  }
}