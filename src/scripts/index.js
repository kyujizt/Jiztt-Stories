import "../styles/styles.css";
import App from "./pages/app";
import "./components/nav-bar"; // Import navigation component

import { requestNotificationPermission, subscribeUserToPush } from "./utils/push-helper";
import { sendSubscription } from "./data/api";

import { saveStory, getStories, deleteStory } from "./utils/indexDB";

// 🔥 Jadikan fungsi tersedia di console
window.saveStory = saveStory;
window.getStories = getStories;
window.deleteStory = deleteStory;

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      // Daftarkan service worker dengan path absolut sesuai lokasi file sw.js
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered with scope:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  } else {
    throw new Error("Service Worker tidak didukung di browser ini");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    console.log("🔁 Hash changed");
    await app.renderPage();
  });

  // --- Push Notification Setup ---
  try {
    const registration = await registerServiceWorker();
    await requestNotificationPermission();

    // Cek apakah sudah subscribe sebelumnya
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await subscribeUserToPush(registration);
      console.log("Subscription baru dibuat:", subscription);

      // Kirim subscription ke backend
      await sendSubscription(subscription);
      console.log("Subscription dikirim ke server");
    } else {
      console.log("Sudah subscribe sebelumnya:", subscription);
    }
  } catch (error) {
    console.error("❌ Error push notification setup:", error.message);
  }
});
