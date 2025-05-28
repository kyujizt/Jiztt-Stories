import L from "leaflet";

const OfflineView = {
  setupSkipToContent() {
    const mainContent = document.querySelector("#main-content");
    const skipLink = document.querySelector(".skip-to-content");

    if (skipLink) {
      skipLink.addEventListener("click", (event) => {
        event.preventDefault();
        skipLink.blur();
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: "smooth" });
      });
    }
  },

  showEmptyState() {
    const storyContainer = document.querySelector("#offline-story-list");
    if (!storyContainer) {
      console.error("❌ Elemen #offline-story-list tidak ditemukan.");
      return;
    }
    
    storyContainer.innerHTML = `
      <div class="empty-state">
        <p class="no-stories">Tidak ada cerita tersimpan offline.</p>
        <p class="empty-state-hint">Kembali ke halaman utama dan klik "Simpan Offline" pada cerita yang ingin Anda simpan.</p>
        <a href="/" class="back-to-home-btn">Kembali ke Beranda</a>
      </div>
    `;
  },

  showOfflineStories(stories) {
    const storyContainer = document.querySelector("#offline-story-list");
    if (!storyContainer) {
      console.error("❌ Elemen #offline-story-list tidak ditemukan.");
      return;
    }

    if (!stories || stories.length === 0) {
      this.showEmptyState();
      return;
    }

    storyContainer.innerHTML = stories
      .map((story) => {
        const imageUrl = story.imageUrl || "/src/public/images/placeholder.jpg";
        const formattedDate = story.createdAt
          ? new Date(story.createdAt).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Tanggal tidak tersedia";

        const coordinates = story.location?.lat && story.location?.lng
          ? `<p class="story-coordinates"><strong>Koordinat:</strong> (${story.location.lat}, ${story.location.lng})</p>`
          : "";

        return `
          <div class="story-item" data-id="${story.id}">
            <h3 class="story-title">${story.title || "Judul tidak tersedia"}</h3>
            <img src="${imageUrl}" alt="${story.title}" class="story-image" />
            <p class="story-description">${story.description || "Deskripsi tidak tersedia"}</p>
            ${coordinates}
            <p class="story-date"><strong>Dibuat pada:</strong> ${formattedDate}</p>
            ${story.location?.lat && story.location?.lng
              ? `<div id="offline-story-map-${story.id}" class="story-map" style="height: 200px; margin-top: 1rem;"></div>`
              : "<p class='story-no-location'></p>"}
            <div class="story-actions">
              <button class="delete-offline-btn" data-id="${story.id}">🗑 Hapus dari Offline</button>
            </div>
          </div>
        `;
      })
      .join("");

    // Initialize maps for stories with locations
    stories.forEach((story) => {
      if (story.location?.lat && story.location?.lng) {
        this.showStoryMiniMap(`offline-story-map-${story.id}`, [story.location.lat, story.location.lng]);
      }
    });
  },

  showStoryDetail(story) {
    // Membuat elemen halaman penuh untuk detail cerita
    const detailPage = document.createElement("div");
    detailPage.classList.add("story-detail-page");

    // Format waktu pembuatan cerita (`createdAt`)
    const formattedDate = story.createdAt
      ? new Date(story.createdAt).toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Tanggal tidak tersedia";

    // Tambahkan koordinat hanya jika lokasi valid
    const coordinates = story.location?.lat && story.location?.lng 
      ? `<p class="detail-coordinates"><strong>Koordinat:</strong> (${story.location.lat}, ${story.location.lng})</p>` 
      : "";

    detailPage.innerHTML = `
      <button class="close-page">&times;</button>
      <div class="story-detail-wrapper">
        <div class="story-detail-image">
          <img src="${story.imageUrl}" alt="${story.title}" class="detail-image" />
        </div>
        <div class="story-detail-info">
          <h3 class="detail-title">${story.title}</h3>
          <p class="detail-description">${story.description}</p>
          ${coordinates}
          <p class="detail-date"><strong>Dibuat pada:</strong> ${formattedDate}</p>
          ${story.location?.lat && story.location?.lng 
            ? `<div id="offline-map-fullscreen" class="detail-map"></div>` 
            : "<p class='detail-no-location'>Lokasi tidak tersedia</p>"}
          <div class="offline-badge">
            <span>📱 Tersimpan Offline</span>
          </div>
        </div>
      </div>
    `;

    // Menambahkan halaman detail ke DOM
    document.body.appendChild(detailPage);

    // Tombol untuk menutup halaman penuh
    const closeButton = detailPage.querySelector(".close-page");
    closeButton.addEventListener("click", () => {
      // Hapus elemen halaman detail dari DOM tanpa memaksakan scroll ke beranda
      detailPage.remove();
      console.log("✅ Halaman detail ditutup.");
    });

    // Validasi lokasi sebelum memuat peta
    if (story.location?.lat && story.location?.lng) {
      const mapContainer = document.querySelector("#offline-map-fullscreen");
      if (!mapContainer) {
        console.error("❌ Elemen #offline-map-fullscreen tidak ditemukan.");
        return;
      }

      mapContainer.style.height = "400px";
      mapContainer.style.width = "100%";

      const map = L.map("offline-map-fullscreen").setView([story.location.lat, story.location.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      L.marker([story.location.lat, story.location.lng])
        .addTo(map)
        .bindPopup(`<strong>${story.title}</strong>`)
        .openPopup();

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  },

  showStoryMiniMap(mapId, coords) {
    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;
    
    try {
      const map = L.map(mapId).setView(coords, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      L.marker(coords).addTo(map);
    } catch (error) {
      console.error(`❌ Error initializing map for ${mapId}:`, error);
      mapElement.innerHTML = '<p class="error-message">Gagal memuat peta</p>';
    }
  },

  showError(message) {
    const storyContainer = document.querySelector("#offline-story-list");
    if (!storyContainer) {
      console.error("❌ Elemen #offline-story-list tidak ditemukan.");
      return;
    }
    storyContainer.innerHTML = `<p class="error-message">${message}</p>`;
  },
};

export default OfflineView;
