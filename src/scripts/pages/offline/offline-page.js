import OfflineView from './offline-view';
import { getStories, deleteStory, getStoryById } from '../../utils/indexDB';

export default class OfflinePage {
  constructor() {
    console.log('📱 OfflinePage initialized');
    this.stories = [];
  }
  
  async render() {
    return `
      <div class="skip-container">
        <a href="#main-content" class="skip-to-content" tabindex="0">
          Skip ke Konten Utama
        </a>
      </div>
      
      <main id="main-content" tabindex="-1">
        <div class="content">
          <h2 class="content__heading">Cerita Tersimpan Offline</h2>
          <div id="offline-story-list" class="stories-grid"></div>
        </div>
      </main>
    `;
  }

  async afterRender() {
    try {
      console.log('🔄 Loading offline stories...');
      await this._loadStories();
      
      // Setup skip to content
      OfflineView.setupSkipToContent();
      
      // Setup event listener untuk melihat detail cerita
      this._setupStoryDetailEvents();
      
      console.log('✅ Offline stories loaded successfully');
    } catch (error) {
      console.error('❌ Error loading offline stories:', error);
      OfflineView.showError('Gagal memuat cerita offline');
    }
  }

  async _loadStories() {
    this.stories = await getStories();
    
    // Tampilkan pesan jika tidak ada cerita tersimpan
    if (this.stories.length === 0) {
      OfflineView.showEmptyState();
      return;
    }
    
    OfflineView.showOfflineStories(this.stories);
    this._initializeDeleteButtons();
  }

  _initializeDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-offline-btn');
    deleteButtons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = button.dataset.id;
        
        // Konfirmasi penghapusan
        if (!confirm('Apakah Anda yakin ingin menghapus cerita ini dari penyimpanan offline?')) {
          return;
        }
        
        try {
          console.log(`🗑 Deleting story with ID: ${storyId}`);
          
          // Tampilkan loading state pada tombol
          button.textContent = 'Menghapus...';
          button.disabled = true;
          
          const success = await deleteStory(storyId);
          
          if (success) {
            // Update the stories list without refreshing the page
            this.stories = this.stories.filter(story => story.id !== storyId);
            
            if (this.stories.length === 0) {
              OfflineView.showEmptyState();
            } else {
              OfflineView.showOfflineStories(this.stories);
              this._initializeDeleteButtons(); // Re-initialize delete buttons
              this._setupStoryDetailEvents(); // Re-initialize detail events
            }
            
            console.log('✅ Story deleted and list refreshed');
          } else {
            throw new Error('Failed to delete story');
          }
        } catch (error) {
          console.error('❌ Error deleting story:', error);
          OfflineView.showError('Gagal menghapus cerita');
          
          // Kembalikan tombol ke keadaan semula jika gagal
          button.textContent = 'Hapus';
          button.disabled = false;
        }
      });
    });
  }

  _setupStoryDetailEvents() {
    const storyItems = document.querySelectorAll('.story-item');
    storyItems.forEach((item) => {
      item.addEventListener('click', async (e) => {
        // Jangan trigger jika yang diklik adalah tombol
        if (!e.target.closest('.story-actions')) {
          const storyId = item.dataset.id;
          console.log(`📌 Klik pada cerita offline dengan ID: ${storyId}`);
          
          try {
            // Ambil detail cerita dari IndexedDB
            const story = await getStoryById(storyId);
            if (story) {
              OfflineView.showStoryDetail(story);
            } else {
              throw new Error('Cerita tidak ditemukan');
            }
          } catch (error) {
            console.error('❌ Error saat memuat detail cerita:', error);
            alert('Gagal memuat detail cerita');
          }
        }
      });
    });
  }
}