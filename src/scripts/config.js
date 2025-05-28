const CONFIG = {
  BASE_URL: 'https://story-api.dicoding.dev/v1',
  CACHE_NAME: 'StoryApp-V1',
  DATABASE_NAME: 'story-app-database',
  DATABASE_VERSION: 1,
  OBJECT_STORE_NAME: 'stories',
  // Push Notification Configuration
  BASE_URL_PUSH: 'http://localhost:3021',
  PUSH_MSG_VAPID_PUBLIC_KEY: 'BMHaYSNC6KnWxHDEFJW3t991y3bMlPKzYGyNRrAmuTB-f-vl7i3tbGQmQGY2x3O5l1_hZ5tfLQflqZ-lYl3Azeo',
  get PUSH_MSG_SUBSCRIBE_URL() { return `${this.BASE_URL_PUSH}/notifications/subscribe`; },
  get PUSH_MSG_UNSUBSCRIBE_URL() { return `${this.BASE_URL_PUSH}/notifications/unsubscribe`; },
  get PUSH_MSG_VAPID_URL() { return `${this.BASE_URL_PUSH}/notifications/vapid-key`; },
  get PUSH_MSG_BROADCAST_URL() { return `${this.BASE_URL_PUSH}/notifications`; }
};

export default CONFIG;
