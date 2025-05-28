import L from "leaflet";

const AddStoryView = {
  initMap(selectedLatLng, onLocationChange) {
    const map = L.map("map").setView([selectedLatLng.lat, selectedLatLng.lng], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([selectedLatLng.lat, selectedLatLng.lng], { draggable: true }).addTo(map);

    marker.on("moveend", (e) => {
      onLocationChange(e.target.getLatLng());
    });

    map.on("click", (e) => {
      onLocationChange(e.latlng);
      marker.setLatLng(e.latlng);
    });

    return { map, marker };
  },

  updateLocationDisplay(selectedLatLng) {
    document.querySelector("#location-coordinates").textContent = `Latitude: ${selectedLatLng.lat.toFixed(5)}, Longitude: ${selectedLatLng.lng.toFixed(5)}`;
  },

  setupCamera(onCameraActivate, onCameraCapture, onStopCamera) {
    const activateCameraButton = document.getElementById("activate-camera-button");
    const cameraVideo = document.getElementById("camera-video");
    const cameraCanvas = document.getElementById("camera-canvas");
    const cameraTakeButton = document.getElementById("camera-take-button");
    const cameraOutputList = document.getElementById("camera-list-output");

    activateCameraButton.addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        onCameraActivate(stream);
        cameraVideo.srcObject = stream;
        cameraVideo.style.display = "block";
        cameraTakeButton.style.display = "block";

        let stopCameraButton = document.getElementById("camera-stop-button");
        if (!stopCameraButton) {
          stopCameraButton = document.createElement("button");
          stopCameraButton.id = "camera-stop-button";
          stopCameraButton.textContent = "Matikan Kamera";
          stopCameraButton.style.marginTop = "1rem";
          cameraOutputList.parentElement.appendChild(stopCameraButton);

          stopCameraButton.addEventListener("click", () => {
            onStopCamera();
            AddStoryView.hideCamera(); // <-- perbaikan
          });
        }
      } catch (error) {
        AddStoryView.showAlert("Gagal mengakses kamera. Pastikan Anda memberikan izin."); // <-- perbaikan
      }
    });

    cameraTakeButton.addEventListener("click", async () => {
      const context = cameraCanvas.getContext("2d");
      cameraCanvas.width = cameraVideo.videoWidth;
      cameraCanvas.height = cameraVideo.videoHeight;
      context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

      cameraCanvas.toBlob((blob) => {
        if (blob) {
          onCameraCapture(blob);
          const imageURL = URL.createObjectURL(blob);
          cameraOutputList.innerHTML = `<li><img src="${imageURL}" alt="Preview" style="width: 100%; max-width: 300px;"></li>`;
          setTimeout(() => URL.revokeObjectURL(imageURL), 5000);
        }
      }, "image/jpeg");
    });
  },

  hideCamera() {
    const cameraVideo = document.getElementById("camera-video");
    const cameraTakeButton = document.getElementById("camera-take-button");

    if (cameraVideo) {
      cameraVideo.srcObject = null;
      cameraVideo.style.display = "none";
    }

    if (cameraTakeButton) {
      cameraTakeButton.style.display = "none";
    }

    const stopCameraButton = document.getElementById("camera-stop-button");
    if (stopCameraButton) stopCameraButton.remove();
  },

  setupForm(onSubmit) {
    const form = document.getElementById("add-story-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const description = document.querySelector("#description").value;
      const fileInput = document.querySelector("#image").files[0];
      onSubmit(description, fileInput);
    });
  },

  bindHashChange(callback) {
    window.addEventListener("hashchange", callback);
  },

  goToHomePage() {
    window.location.hash = "/";
  },

  showAlert(message) {
    alert(message);
  },

  setupPushNotificationButton(onClick) {
    const notifBtn = document.getElementById("notif-btn");
    if (!notifBtn) return;
    notifBtn.addEventListener("click", onClick);
  },

  updateNotifButton(isSubscribed) {
    const notifBtn = document.getElementById("notif-btn");
    if (!notifBtn) return;
    
    if (!('Notification' in window)) {
      notifBtn.textContent = "Notifikasi tidak didukung";
      notifBtn.disabled = true;
      return;
    }
    
    notifBtn.disabled = false;
    notifBtn.textContent = isSubscribed ? "Nonaktifkan Notifikasi" : "Aktifkan Notifikasi";
  },
  
  // Fungsi baru untuk update UI notifikasi dengan lebih detail
  updateNotificationUI(isSupported, isSubscribed) {
    const notifBtn = document.getElementById("notif-btn");
    if (!notifBtn) return;
    
    if (!isSupported) {
      notifBtn.textContent = "Notifikasi tidak didukung";
      notifBtn.disabled = true;
      return;
    }
    
    notifBtn.disabled = false;
    notifBtn.textContent = isSubscribed 
      ? "Nonaktifkan Notifikasi" 
      : "Aktifkan Notifikasi";
  },

  showLoading() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
  },

  hideLoading() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  },
};

export default AddStoryView;
