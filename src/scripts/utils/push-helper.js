const SERVICE_WORKER_PATHS = [
  "/sw.js",
  "/public/sw.js",
  "/src/public/sw.js"
];

let serviceWorkerRegistration = null;

// Key yang konsisten untuk localStorage
const NOTIFICATION_KEY = 'notificationsEnabled';

// Pastikan navigator.serviceWorker tersedia sebelum menambahkan event listener
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data.type === 'NEW_STORY') {
      const isSubscribed = await isUserSubscribed();
      
      if (isSubscribed && Notification.permission === 'granted') {
        const story = event.data.story;
        simulatePushNotification(
          'Story Baru',
          `${story.name} membagikan cerita baru`,
          '/',
          story.photoUrl
        );
      } else {
        console.log('Notifikasi cerita baru tidak ditampilkan karena notifikasi dinonaktifkan');
      }
    }
  });
}

export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    // Jika serviceWorkerRegistration sudah ada, gunakan itu
    if (serviceWorkerRegistration) {
      console.log("Using cached service worker registration");
      return serviceWorkerRegistration;
    }
    
    // Check existing registration
    try {
      const existingReg = await navigator.serviceWorker.ready;
      if (existingReg && existingReg.active) {
        console.log("Using existing service worker registration:", existingReg);
        serviceWorkerRegistration = existingReg;
        return existingReg;
      }
    } catch (err) {
      console.log("No existing service worker found, will register new one");
    }

    // Try each path until one works
    for (const path of SERVICE_WORKER_PATHS) {
      try {
        console.log(`Attempting to register service worker at: ${path}`);
        const registration = await navigator.serviceWorker.register(path);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        console.log("✅ Service Worker registered:", registration);
        serviceWorkerRegistration = registration;
        return registration;
      } catch (error) {
        console.warn(`Failed to register service worker at ${path}:`, error);
        // Continue to the next path
      }
    }
    
    console.error("❌ All service worker registration attempts failed");
    return null;
  }
  console.warn("Service Worker not supported in this browser");
  return null;
}

// Check if notifications are supported
function checkNotificationSupport() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Check if notifications are enabled
export const isPushNotificationSupported = () => {
  return checkNotificationSupport();
};

// Request notification permission
export async function requestNotificationPermission() {
  if (!checkNotificationSupport()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("❌ Izin notifikasi tidak diberikan.");
      return false;
    }
    console.log("✅ Izin notifikasi diberikan.");
    return true;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

// Subscribe to notifications
export async function subscribeUserToPush() {
  try {
    if (!serviceWorkerRegistration) {
      serviceWorkerRegistration = await registerServiceWorker();
    }
    
    if (!serviceWorkerRegistration) {
      throw new Error("Tidak dapat mendaftarkan Service Worker");
    }
    
    if (!checkNotificationSupport()) {
      throw new Error("Notifications not supported in this browser");
    }
    
    // Periksa apakah izin sudah diberikan
    if (Notification.permission !== 'granted') {
      throw new Error("Izin notifikasi belum diberikan");
    }
    
    // Periksa apakah sudah berlangganan
    const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
    
    if (existingSubscription) {
      console.log("Pengguna sudah berlangganan push notification");
    } else {
      console.log("Berlangganan push notification berhasil");
    }
    
    // Simpan status langganan di localStorage dengan key yang konsisten
    localStorage.setItem(NOTIFICATION_KEY, 'true');
    // Bersihkan key alternatif yang mungkin ada
    localStorage.removeItem('notificationEnabled');
    
    console.log("✅ Pengguna berhasil mengaktifkan notifikasi");
    
    // Update UI immediately
    updateNotifButton(true);
    
    // Show welcome notification
    try {
      await simulatePushNotification(
        'Notifikasi Diaktifkan',
        'Anda akan menerima notifikasi saat membuat cerita baru'
      );
    } catch (notifError) {
      console.warn("Gagal menampilkan notifikasi aktivasi:", notifError);
      alert('Notifikasi berhasil diaktifkan');
    }
    
    return true;
  } catch (error) {
    console.error("❌ Gagal mengaktifkan notifikasi:", error.message);
    // Pastikan status di localStorage konsisten dengan kegagalan
    localStorage.removeItem(NOTIFICATION_KEY);
    localStorage.removeItem('notificationEnabled');
    
    // Update UI to reflect failure
    updateNotifButton(false);
    throw error;
  }
}

// Unsubscribe from notifications
export async function unsubscribeUserFromPush() {
  try {
    // Remove from localStorage first dengan key yang konsisten
    localStorage.removeItem(NOTIFICATION_KEY);
    localStorage.removeItem('notificationEnabled');

    // Unsubscribe from push manager
    if (serviceWorkerRegistration) {
      const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log("Unsubscribed from push notifications");
      }
    }

    // Update UI immediately
    updateNotifButton(false);

    // Show confirmation
    try {
      await simulatePushNotification(
        'Notifikasi Dinonaktifkan',
        'Anda tidak akan menerima notifikasi lagi'
      );
    } catch (notifError) {
      console.warn("Gagal menampilkan notifikasi nonaktif:", notifError);
      alert('Notifikasi berhasil dinonaktifkan');
    }
    
    console.log("✅ Notifikasi berhasil dinonaktifkan");
    return true;
  } catch (error) {
    console.error("❌ Gagal menonaktifkan notifikasi:", error.message);
    // Update UI to reflect current state
    updateNotifButton(await isUserSubscribed());
    throw error;
  }
}

// Check if notifications are enabled
export async function isUserSubscribed() {
  try {
    // Check localStorage dengan key yang konsisten
    const storedPreference = localStorage.getItem(NOTIFICATION_KEY) === 'true';
    
    // Untuk kompatibilitas, cek juga key lama
    const legacyPreference = localStorage.getItem('notificationEnabled') === 'true';
    
    // Jika ada nilai di key lama, migrate ke key baru
    if (legacyPreference && !storedPreference) {
      localStorage.setItem(NOTIFICATION_KEY, 'true');
      localStorage.removeItem('notificationEnabled');
      return true;
    }
    
    // Jika tidak ada service worker support, return berdasarkan localStorage saja
    if (!checkNotificationSupport()) {
      return storedPreference;
    }
    
    // Jika service worker belum terdaftar, coba daftarkan
    if (!serviceWorkerRegistration) {
      try {
        await registerServiceWorker();
      } catch (regError) {
        console.warn("Gagal mendaftarkan service worker:", regError);
        return storedPreference;
      }
    }
    
    // Jika service worker terdaftar, periksa status langganan sebenarnya
    if (serviceWorkerRegistration) {
      try {
        const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
        const hasPermission = Notification.permission === 'granted';
        const actualStatus = storedPreference && hasPermission;
        
        return actualStatus;
      } catch (subError) {
        console.warn("Gagal memeriksa subscription:", subError);
        return storedPreference;
      }
    }
    
    return storedPreference;
  } catch (error) {
    console.error("Error checking notification status:", error);
    return false;
  }
}

// Show a notification using the service worker
export async function simulatePushNotification(title, body, url = '/', image = null) {
  try {
    // Prevent duplicate notifications with a simple debounce
    const notificationKey = `${title}-${body}`;
    const lastNotificationTime = window.lastNotificationTimes || {};
    const now = Date.now();
    
    if (lastNotificationTime[notificationKey] && 
        (now - lastNotificationTime[notificationKey]) < 2000) { // 2 second debounce
      console.log('Duplicate notification prevented:', title);
      return;
    }
    
    // Initialize if not exists
    if (!window.lastNotificationTimes) {
      window.lastNotificationTimes = {};
    }
    window.lastNotificationTimes[notificationKey] = now;
    
    // Clean up old entries (keep only last 10)
    const keys = Object.keys(window.lastNotificationTimes);
    if (keys.length > 10) {
      const oldestKey = keys.reduce((oldest, key) => 
        window.lastNotificationTimes[key] < window.lastNotificationTimes[oldest] ? key : oldest
      );
      delete window.lastNotificationTimes[oldestKey];
    }

    // Untuk notifikasi khusus, selalu tampilkan
    if (title === 'Notifikasi Diaktifkan' || title === 'Notifikasi Dinonaktifkan') {
      if (title === 'Notifikasi Dinonaktifkan') {
        alert(`${title}: ${body}`);
        return;
      }
    } else {
      // Check if notifications are enabled untuk notifikasi biasa
      const isSubscribed = await isUserSubscribed();
      
      if (!isSubscribed) {
        console.log('Notifikasi tidak ditampilkan karena notifikasi dinonaktifkan');
        return;
      }
      
      // Periksa izin notifikasi
      if (Notification.permission !== 'granted') {
        console.log('Notifikasi tidak ditampilkan karena izin tidak diberikan');
        return;
      }
    }
    
    // Try to use service worker if available
    if (serviceWorkerRegistration && serviceWorkerRegistration.active) {
      // Send message to service worker to show notification
      serviceWorkerRegistration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        url,
        image
      });
      
      console.log('Notification sent to service worker:', title);
      return;
    }
    
    // Fallback to browser notification API
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: image || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { url }
      });
      console.log('Browser notification shown:', title);
      return;
    }
    
    // Final fallback to alert for important notifications
    if (title === 'Notifikasi Diaktifkan' || title === 'Notifikasi Dinonaktifkan') {
      alert(`${title}: ${body}`);
    }
  } catch (error) {
    console.error('Error showing notification:', error);
    
    // Fallback to alert for important notifications
    if (title === 'Notifikasi Diaktifkan' || title === 'Notifikasi Dinonaktifkan') {
      alert(`${title}: ${body}`);
    }
  }
}

// Update UI tombol notif sesuai status subscription
export function updateNotifButton(isSubscribed, btn = null) {
  if (!btn) {
    btn = document.getElementById("notif-btn");
    if (!btn) {
      console.warn("Notification button not found");
      return;
    }
  }
  
  // Update button text and state
  if (isSubscribed) {
    btn.textContent = "Nonaktifkan Notifikasi";
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-danger');
  } else {
    btn.textContent = "Aktifkan Notifikasi";
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-primary');
  }
  
  btn.disabled = false;
  
  console.log(`Button updated: isSubscribed=${isSubscribed}, text="${btn.textContent}"`);
}

// Helper function untuk mengkonversi base64 ke Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Initialize notification button - Simplified version
async function initializeNotificationButton() {
  const notifBtn = document.getElementById("notif-btn");
  if (!notifBtn) {
    console.warn("Notification button not found");
    return;
  }

  try {
    // Register service worker first
    await registerServiceWorker();
    
    // Check current subscription status
    const subscribed = await isUserSubscribed();
    updateNotifButton(subscribed, notifBtn);

    // Add event listener only once
    if (!notifBtn.hasAttribute('data-listener-attached')) {
      notifBtn.setAttribute('data-listener-attached', 'true');
      
      notifBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        
        // Disable button during processing
        notifBtn.disabled = true;
        const originalText = notifBtn.textContent;
        notifBtn.textContent = "Memproses...";

        try {
          const currentStatus = await isUserSubscribed();
          
          if (!currentStatus) {
            // Try to subscribe
            const permissionGranted = await requestNotificationPermission();
            if (permissionGranted) {
              await subscribeUserToPush();
              // Button updated in subscribeUserToPush
            } else {
              alert("Izin notifikasi diperlukan untuk mengaktifkan fitur ini");
              updateNotifButton(false, notifBtn);
            }
          } else {
            // Unsubscribe
            await unsubscribeUserFromPush();
            // Button updated in unsubscribeUserFromPush
          }
        } catch (error) {
          console.error("Error toggling notification:", error);
          alert("Gagal mengubah status notifikasi: " + error.message);
          
          // Restore button state
          notifBtn.textContent = originalText;
          updateNotifButton(await isUserSubscribed(), notifBtn);
        }
      });
    }
  } catch (error) {
    console.error("Gagal setup notification button:", error);
    updateNotifButton(false, notifBtn);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotificationButton);
} else {
  // Use setTimeout to ensure DOM is fully rendered
  setTimeout(initializeNotificationButton, 100);
}

// Export the initialization function for manual use
export { initializeNotificationButton };

// For backward compatibility with existing code
export const isSubscribedToPushNotification = isUserSubscribed;
export const subscribePushNotification = subscribeUserToPush;
export const unsubscribePushNotification = unsubscribeUserFromPush;
export const subscribePushMessage = subscribeUserToPush;
export const unsubscribePushMessage = unsubscribeUserFromPush;