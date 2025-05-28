class NavBar extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <nav class="nav-bar">
        <div class="nav-brand">
          <a href="/">Story App</a>
        </div>
        <ul class="nav-links">
          <li><a href="/">Beranda</a></li>
          <li><a href="/offline">Cerita Offline</a></li>
          <li><a href="/add-story">Tambah Cerita</a></li>
          <li><a href="/about">Tentang</a></li>
        </ul>
      </nav>
    `;
  }
}

customElements.define('nav-bar', NavBar);
