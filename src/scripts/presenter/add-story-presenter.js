import { addStory } from "../data/api";
import AddStoryView from "../pages/add-story/add-story-view";
import {
  registerServiceWorker,
  isUserSubscribed,
  requestNotificationPermission,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  simulatePushNotification,
  updateNotifButton
} from "../utils/push-helper.js";

export default class AddStoryPresenter {
  constructor() {
    this.selectedLatLng = { lat: -6.2, lng: 106.8 };
    this.cameraImageBlob = null;
    this.cameraStream = null;
    this.registration = null;
    this.isSubscribed = false;
  }

  async init() {
    AddStoryView.updateLocationDisplay(this.selectedLatLng);

    const { marker } = AddStoryView.initMap(this.selectedLatLng, (newLocation) => {
      this.selectedLatLng = newLocation;
      AddStoryView.updateLocationDisplay(this.selectedLatLng);
    });

    AddStoryView.setupCamera(
      (stream) => {
        this.cameraStream = stream;
      },
      (imageBlob) => {
        this.cameraImageBlob = imageBlob;
      },
      () => this._stopCamera()
    );

    AddStoryView.setupForm((description, file) => this._handleSubmit(description, file));
    AddStoryView.bindHashChange(() => this._stopCamera());

    await this._setupPushNotifications();
    AddStoryView.setupPushNotificationButton(() => this._handleNotifToggle());
  }

  async _handleSubmit(description, file) {
    const imageFile = file || this.cameraImageBlob;
    if (!imageFile) {
      AddStoryView.showAlert("Silakan unggah gambar atau ambil gambar dari kamera!");
      return;
    }

    try {
      AddStoryView.showLoading();

      // Upload story
      const result = await addStory({ description, imageFile, location: this.selectedLatLng });
      
      if (result?.error) {
        throw new Error(result.error);
      }

      // Kirim push notification - using simulation instead of server
      try {
        // Check if notifications are supported and subscribed
        const userPreference = localStorage.getItem('notificationPreference');
        if ("Notification" in window && 
            Notification.permission === "granted" && 
            userPreference === 'subscribed') {
          
          // Create notification content
          const notifTitle = "Story Baru Ditambahkan!";
          const notifBody = description.substring(0, 100) + (description.length > 100 ? "..." : "");
          
          // Use simulatePushNotification to show notification without server
          await simulatePushNotification(notifTitle, notifBody);
          console.log("✅ Push notification berhasil dikirim");
        }
      } catch (notifError) {
        console.warn("⚠️ Gagal mengirim push notification:", notifError);
        // Lanjutkan proses meskipun notifikasi gagal
      }

      AddStoryView.showAlert("Cerita berhasil ditambahkan!");
      this._stopCamera();
      AddStoryView.goToHomePage();
    } catch (error) {
      AddStoryView.showAlert(error.message || "Gagal menambahkan cerita. Coba lagi.");
      console.error("❌ Error:", error);
    } finally {
      AddStoryView.hideLoading();
    }
  }

  _stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    AddStoryView.hideCamera();
  }

  async _setupPushNotifications() {
    // Cek apakah browser mendukung notifikasi
    if (!('Notification' in window)) {
      console.log('Browser tidak mendukung notifikasi');
      AddStoryView.updateNotifButton(false);
      return;
    }

    try {
      // Cek status izin notifikasi yang ada
      const currentPermission = Notification.permission;
      
      // Dapatkan preferensi pengguna dari localStorage
      const userPreference = localStorage.getItem('notificationPreference');
      
      // Update UI berdasarkan status saat ini
      const isSubscribed = currentPermission === 'granted' && userPreference === 'subscribed';
      this.isSubscribed = isSubscribed;
      
      // Dapatkan service worker registration tanpa meminta izin
      if ('serviceWorker' in navigator) {
        this.registration = await registerServiceWorker();
        
        if (!this.registration) {
          throw new Error("Gagal mendaftarkan service worker");
        }
        
        console.log("✅ Service Worker terdaftar:", this.registration.scope);
      }
      
      // Update button state
      AddStoryView.updateNotifButton(this.isSubscribed);
    } catch (error) {
      console.error("❌ Gagal setup notifikasi:", error);
    }
  }

  async _handleNotifToggle() {
    if (!('Notification' in window)) {
      AddStoryView.showAlert('Browser Anda tidak mendukung notifikasi');
      return;
    }
    
    const btn = document.getElementById("notif-btn");
    if (!btn) return;
    
    btn.disabled = true;

    try {
      if (this.isSubscribed) {
        console.log("🔕 Proses Unsubscribe dimulai...");
        await unsubscribeUserFromPush();
        
        // Simpan preferensi pengguna
        localStorage.setItem('notificationPreference', 'unsubscribed');
        this.isSubscribed = false;
        
        // Show confirmation notification
        simulatePushNotification(
          'Notifikasi Dinonaktifkan',
          'Anda telah menonaktifkan notifikasi Story App'
        );
      } else {
        console.log("🔔 Proses Subscribe dimulai...");
        const permissionGranted = await requestNotificationPermission();
        
        if (!permissionGranted) {
          localStorage.setItem('notificationPreference', 'denied');
          AddStoryView.showAlert("Izin notifikasi ditolak.");
          return;
        }
        
        await subscribeUserToPush();
        
        // Simpan preferensi pengguna
        localStorage.setItem('notificationPreference', 'subscribed');
        this.isSubscribed = true;
        
        // Show welcome notification
        simulatePushNotification(
          'Notifikasi Diaktifkan',
          'Anda akan menerima notifikasi saat membuat cerita baru'
        );
      }

      // Update button state
      AddStoryView.updateNotifButton(this.isSubscribed);
    } catch (error) {
      console.error("❌ Gagal toggle notifikasi:", error);
      AddStoryView.showAlert(`Gagal ${this.isSubscribed ? 'menonaktifkan' : 'mengaktifkan'} notifikasi: ${error.message}`);
    } finally {
      btn.disabled = false;
    }
  }
}
