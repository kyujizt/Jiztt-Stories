import CONFIG from "../config";
import { simulatePushNotification, isUserSubscribed } from "../utils/push-helper.js";

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
  VAPID_KEY: CONFIG.PUSH_MSG_VAPID_URL,
  SUBSCRIBE: CONFIG.PUSH_MSG_SUBSCRIBE_URL,
  UNSUBSCRIBE: CONFIG.PUSH_MSG_UNSUBSCRIBE_URL,
  BROADCAST: CONFIG.PUSH_MSG_BROADCAST_URL
};

function getAuthToken() {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Token otentikasi tidak ditemukan. Silakan login terlebih dahulu.");
  return token;
}

function validateResponse(response) {
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
}

let controller = null;

export async function getData() {
  try {
    if (controller) controller.abort();
    controller = new AbortController();

    const token = getAuthToken();
    const response = await fetch(ENDPOINTS.STORIES, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    validateResponse(response);
    const result = await response.json();

    if (!Array.isArray(result.listStory)) {
      throw new Error("Data cerita tidak valid.");
    }

    return result.listStory.map((story) => ({
      id: story.id,
      title: story.name || "Tanpa Nama",
      description: story.description || "Tanpa Deskripsi",
      imageUrl: story.photoUrl?.startsWith("http") ? story.photoUrl : "/src/public/images/placeholder.jpg",
      createdAt: story.createdAt || null,
      location: {
        lat: typeof story.lat === "number" ? story.lat : null,
        lng: typeof story.lon === "number" ? story.lon : null,
      },
    }));
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Fetch cerita dibatalkan.");
      return [];
    }
    console.error("❌ Gagal mengambil data cerita:", error.message);
    return [];
  } finally {
    controller = null;
  }
}

export async function getDataById(id) {
  try {
    if (!id) throw new Error("ID tidak valid.");

    const token = getAuthToken();
    const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    validateResponse(response);
    const result = await response.json();

    if (!result.story) {
      throw new Error("Detail cerita tidak ditemukan.");
    }

    return {
      id: result.story.id,
      title: result.story.name || "Tanpa Nama",
      description: result.story.description || "Tanpa Deskripsi",
      imageUrl: result.story.photoUrl?.startsWith("http") ? result.story.photoUrl : "/src/public/images/placeholder.jpg",
      createdAt: result.story.createdAt || null,
      location: {
        lat: typeof result.story.lat === "number" ? result.story.lat : null,
        lng: typeof result.story.lon === "number" ? result.story.lon : null,
      },
    };
  } catch (error) {
    console.error("❌ Error in getDataById:", error.message);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    validateResponse(response);
    const result = await response.json();

    if (!result.loginResult?.token) {
      throw new Error("Login berhasil, tapi token tidak ditemukan.");
    }

    return result.loginResult.token;
  } catch (error) {
    console.error("❌ Login error:", error.message);
    throw error;
  }
}

export async function registerUser({ name, email, password }) {
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    validateResponse(response);
    return await response.json();
  } catch (error) {
    console.error("❌ Register error:", error.message);
    throw error;
  }
}

export async function addStory({ description, imageFile, location }) {
  try {
    const token = getAuthToken();
    const formData = new FormData();

    formData.append("description", description);
    formData.append("photo", imageFile);
    if (location?.lat && location?.lng) {
      formData.append("lat", location.lat);
      formData.append("lon", location.lng);
    }

    const response = await fetch(ENDPOINTS.STORIES, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    validateResponse(response);
    
    // Check if user is subscribed before showing notification
    try {
      const isSubscribed = await isUserSubscribed();
      if (isSubscribed) {
        await simulatePushNotification(
          "Story Baru Telah Dibuat!",
          `Story baru telah dibuat dengan deskripsi: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`
        );
        console.log("✅ Notifikasi ditampilkan karena pengguna berlangganan");
      } else {
        console.log("ℹ️ Notifikasi tidak ditampilkan karena pengguna tidak berlangganan");
      }
    } catch (notifError) {
      console.warn("⚠️ Gagal menampilkan notifikasi:", notifError);
    }
    
    return await response.json();
  } catch (error) {
    console.error("❌ Gagal menambahkan cerita:", error.message);
    throw error;
  }
}

// Simplified version that returns a hardcoded VAPID key
export async function getVapidPublicKey() {
  try {
    // Try to fetch from server first
    try {
      const response = await fetch(CONFIG.PUSH_MSG_VAPID_URL);
      const data = await response.json();
      return data.key;
    } catch (fetchError) {
      console.warn('⚠️ Could not fetch VAPID key from server, using fallback:', fetchError);
      // Fallback to hardcoded key
      return 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
    }
  } catch (error) {
    console.error('❌ Error getVapidPublicKey:', error);
    throw error;
  }
}

// Simplified version that stores subscription in localStorage
export async function sendSubscription(subscription) {
  try {
    if (!subscription || typeof subscription !== "object") {
      throw new Error("Subscription tidak valid.");
    }

    // Store in localStorage for demo purposes
    localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    console.log("✅ Subscription disimpan di localStorage");
    
    // Try to send to server if online
    if (navigator.onLine) {
      try {
        const token = getAuthToken();
        const response = await fetch(ENDPOINTS.SUBSCRIBE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(subscription),
        });
        
        validateResponse(response);
        console.log("✅ Subscription berhasil dikirim ke server");
        return await response.json();
      } catch (serverError) {
        console.warn("⚠️ Gagal mengirim subscription ke server:", serverError.message);
        // Return success anyway since we stored it locally
        return { success: true, message: "Subscription disimpan secara lokal" };
      }
    } else {
      return { success: true, message: "Browser offline, subscription disimpan secara lokal" };
    }
  } catch (error) {
    console.error("❌ Error sendSubscription:", error.message);
    throw error;
  }
}

// Simplified version that removes subscription from localStorage
export async function removeSubscription(subscription) {
  try {
    if (!subscription || typeof subscription !== "object") {
      throw new Error("❌ Subscription tidak valid untuk dihapus.");
    }

    console.log("🔍 Subscription sebelum dihapus:", subscription);

    // Remove from browser
    if (subscription.unsubscribe) {
      await subscription.unsubscribe();
      console.log("✅ Subscription berhasil dihapus dari browser.");
    }
    
    // Remove from localStorage
    localStorage.removeItem('pushSubscription');
    console.log("✅ Subscription berhasil dihapus dari localStorage.");

    // Try to remove from server if online
    if (navigator.onLine) {
      try {
        const token = getAuthToken();
        const response = await fetch(ENDPOINTS.UNSUBSCRIBE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        validateResponse(response);
        const result = await response.json();

        if (result.success) {
          console.log("✅ Subscription berhasil dihapus dari server.");
        } else {
          console.warn("⚠️ Server gagal menghapus subscription.");
        }
        
        return result;
      } catch (serverError) {
        console.warn("⚠️ Gagal menghapus subscription dari server:", serverError.message);
        // Return success anyway since we removed it locally
        return { success: true, message: "Subscription dihapus secara lokal" };
      }
    } else {
      return { success: true, message: "Browser offline, subscription dihapus secara lokal" };
    }
  } catch (error) {
    console.error("❌ Gagal menghapus subscription:", error.message);
    throw error;
  }
}

export async function sendPushNotification({ title, body, location, storyId, description }) {
  try {
    // Check if user is subscribed before sending notification
    const isSubscribed = await isUserSubscribed();
    if (!isSubscribed) {
      console.log("ℹ️ Push notification tidak dikirim karena pengguna tidak berlangganan");
      return { success: false, message: "User not subscribed" };
    }

    const storyUrl = `/story/${storyId}`;

    const payload = {
      title: title || "Story Baru Telah Dibuat!",
      body: body || `Story baru telah dibuat dengan deskripsi: ${description}`,
      options: {
        body: body || `Story baru telah dibuat dengan deskripsi: ${description}`,
        icon: "/favicon.png",
        badge: "/favicon.png",
        data: {
          url: storyUrl,
          location: location || {},
          storyId,
          description
        }
      }
    };

    console.log('📤 Mengirim push notification dengan payload:', payload);

    // Try to send to server first
    if (navigator.onLine) {
      try {
        const response = await fetch(ENDPOINTS.BROADCAST, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log("✅ Push notification berhasil dikirim ke server");
          return await response.json();
        } else {
          throw new Error(`Server error ${response.status}`);
        }
      } catch (serverError) {
        console.warn("⚠️ Gagal mengirim push notification ke server:", serverError.message);
        console.log("🔄 Mencoba simulasi notifikasi lokal...");
      }
    }

    // Fallback to local simulation if server fails or offline
    await simulatePushNotification(
      payload.title,
      payload.options.body,
      payload.options.data.url
    );
    
    console.log("✅ Push notification berhasil disimulasikan secara lokal");
    return { success: true, message: "Notification shown locally" };
  } catch (error) {
    console.error("❌ Gagal mengirim push notification:", error.message);
    throw error;
  }
}
