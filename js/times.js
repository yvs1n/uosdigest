/**
 * University of Sharjah - The UOS Times Broadsheet Controller (Pure Vanilla JS)
 */

import { getTimesArticles, initLiveSync } from './storage.js';

let articles = [];
let activeCategory = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initTimesPage();

  // Connect live real-time Firestore sync
  initLiveSync((key) => {
    if (key === 'times_articles') {
      articles = getTimesArticles();
      renderAll();
    }
  });
});

function initTimesPage() {
  articles = getTimesArticles();
  renderAll();
  initSearchHandler();
  initTipForm();
  updateLiveDate();
}

function updateLiveDate() {
  const dateEl = document.getElementById('times-live-date');
  if (dateEl) {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }
}

function renderAll() {
  renderFrontLead();
  renderArticlesGrid();
}

// 1. Render Front Page Lead & Secondary Column
function renderFrontLead() {
  const target = document.getElementById('times-front-lead-target');
  if (!target) return;

  if (!articles.length) {
    target.innerHTML = `<p style="padding: 2rem; color: #6B7280; font-family: var(--font-mono);">No articles available in the newsroom archive.</p>`;
    return;
  }

  // Pick lead article (marked featured: true, or the first article)
  const lead = articles.find(a => a.featured) || articles[0];
  const secondaries = articles.filter(a => a.id !== lead.id).slice(0, 3);

  target.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr; gap: 2rem;" class="lead-inner-wrap">
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 2.5rem; align-items: stretch;" class="lead-responsive-grid">
        <!-- Lead Main Story -->
        <div class="times-lead-card times-col-border" style="cursor: pointer;" onclick="window.openArticleModal('${lead.id}')">
          <div style="width: 100%; height: 22rem; overflow: hidden; background: #E5E7EB; border-bottom: 2px solid var(--uos-ink);">
            <img src="${lead.coverImage}" alt="${lead.title}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="padding: 1.75rem; display: flex; flex-direction: column; justify-content: space-between; flex: 1;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="times-category-pill">${lead.category}</span>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; color: #6B7280;">${lead.readTime || '4 min read'}</span>
              </div>
              <h2 class="times-headline" style="margin-bottom: 0.5rem;">
                ${lead.title}
              </h2>
              <p class="times-deck" style="margin-bottom: 1rem;">
                "${lead.subtitle || lead.excerpt}"
              </p>
              <p style="font-size: 0.95rem; color: #374151; line-height: 1.6; margin-bottom: 1.5rem; font-family: var(--font-serif);">
                ${lead.excerpt}
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--uos-border); padding-top: 1rem;">
              <div class="times-byline">
                <span>By <strong>${lead.author}</strong></span>
                <span>•</span>
                <span>${lead.date}</span>
              </div>
              <span style="font-family: var(--font-mono); font-size: 0.75rem; font-weight: bold; color: var(--uos-times-green);">
                READ DISPATCH ↗
              </span>
            </div>
          </div>
        </div>

        <!-- Secondary Highlights Column -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="font-family: var(--font-mono); font-size: 0.7rem; font-weight: bold; color: var(--uos-times-green); border-bottom: 2px solid var(--uos-ink); padding-bottom: 0.35rem; text-transform: uppercase;">
            TOP CAMPUS DEVELOPMENTS
          </div>
          ${secondaries.map((sec) => `
            <div style="border-bottom: 1px solid var(--uos-border); padding-bottom: 1.25rem; cursor: pointer;" onclick="window.openArticleModal('${sec.id}')">
              <div style="display: flex; gap: 1rem;">
                ${sec.coverImage ? `
                  <img src="${sec.coverImage}" alt="${sec.title}" style="width: 5.5rem; height: 5.5rem; object-fit: cover; border: 1px solid var(--uos-ink); flex-shrink: 0;" />
                ` : ''}
                <div>
                  <span class="times-category-pill" style="font-size: 0.6rem; padding: 0.1rem 0.4rem; margin-bottom: 0.25rem;">${sec.category}</span>
                  <h3 class="times-headline-md" style="font-size: 1.05rem; line-height: 1.25; margin-bottom: 0.25rem;">
                    ${sec.title}
                  </h3>
                  <div class="times-byline" style="font-size: 0.65rem;">
                    <span>${sec.author}</span>
                    <span>•</span>
                    <span>${sec.date}</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}

          <!-- Newspaper Dispatch Box -->
          <div style="background: var(--uos-times-green-tint); border: 1px solid var(--uos-times-green); padding: 1.25rem; margin-top: auto;">
            <span style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: bold; color: var(--uos-times-green-dark); text-transform: uppercase;">
              ABOUT THE UOS TIMES
            </span>
            <p style="font-size: 0.8rem; color: #1F2937; margin-top: 0.5rem; line-height: 1.5;">
              Published weekly during the academic semester by student journalists at the College of Communication. Articles undergo student editorial review.
            </p>
            <button onclick="window.openTipModal()" class="btn-times" style="margin-top: 0.75rem; width: 100%; justify-content: center; padding: 0.5rem; font-size: 0.72rem;">
              Send Newsroom Tip ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 2. Render Articles Grid with Category & Search Filters
function renderArticlesGrid() {
  const grid = document.getElementById('times-articles-grid');
  const titleEl = document.getElementById('current-desk-title');
  if (!grid) return;

  let filtered = [...articles];

  if (activeCategory !== 'all') {
    filtered = filtered.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase());
    if (titleEl) titleEl.textContent = `${activeCategory} Desks`;
  } else {
    if (titleEl) titleEl.textContent = 'All Department Dispatches';
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) ||
      (a.subtitle && a.subtitle.toLowerCase().includes(q)) ||
      (a.author && a.author.toLowerCase().includes(q)) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(q)) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
    );
    if (titleEl) titleEl.textContent = `Search Results for "${searchQuery}" (${filtered.length})`;
  }

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center; border: 1px dashed var(--uos-border); background: #FFFFFF;">
        <span style="font-size: 2rem;">📰</span>
        <h3 class="times-headline" style="font-size: 1.35rem; margin-top: 0.5rem;">No dispatches found</h3>
        <p style="color: #6B7280; font-family: var(--font-mono); font-size: 0.8rem; margin-top: 0.25rem;">
          Try adjusting your desk filter or search query.
        </p>
        <button class="btn-times-outline" style="margin-top: 1rem;" onclick="window.filterTimesCategory('all')">
          Reset Filter to All Desks
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(a => `
    <article class="times-card" onclick="window.openArticleModal('${a.id}')">
      ${a.coverImage ? `
        <div class="times-card-img-wrap">
          <img src="${a.coverImage}" alt="${a.title}" class="times-card-img" loading="lazy" />
          <span style="position: absolute; top: 0.5rem; left: 0.5rem; background: var(--uos-times-green); color: #FFFFFF; font-family: var(--font-mono); font-size: 0.65rem; font-weight: bold; padding: 0.2rem 0.5rem;">
            ${a.category}
          </span>
        </div>
      ` : ''}

      <div class="times-card-body">
        <div>
          <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.68rem; color: #6B7280; margin-bottom: 0.4rem;">
            <span>${a.date}</span>
            <span>${a.readTime || '3 min'}</span>
          </div>

          <h3 class="times-headline-md" style="font-size: 1.2rem; margin-bottom: 0.4rem;">
            ${a.title}
          </h3>

          ${a.subtitle ? `
            <p class="times-deck" style="font-size: 0.85rem; margin-bottom: 0.75rem;">
              "${a.subtitle}"
            </p>
          ` : ''}

          <p style="font-size: 0.88rem; color: #4B5563; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${a.excerpt}
          </p>
        </div>

        <div class="times-card-footer">
          <div class="times-byline" style="font-size: 0.68rem;">
            <span>By <strong>${a.author}</strong></span>
          </div>
          <span>READ ↗</span>
        </div>
      </div>
    </article>
  `).join('');
}

// 3. Category Filter & Search Handlers
window.filterTimesCategory = (cat) => {
  activeCategory = cat;
  const buttons = document.querySelectorAll('#times-desk-nav button');
  buttons.forEach(b => {
    if (b.dataset.category && b.dataset.category.toLowerCase() === cat.toLowerCase()) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  renderArticlesGrid();
  const sec = document.getElementById('all-articles-section');
  if (sec) sec.scrollIntoView({ behavior: 'smooth' });
};

function initSearchHandler() {
  const searchInput = document.getElementById('times-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderArticlesGrid();
    });
  }
}

window.clearTimesSearch = () => {
  const searchInput = document.getElementById('times-search-input');
  if (searchInput) {
    searchInput.value = '';
    searchQuery = '';
    renderArticlesGrid();
  }
};

// 4. Full Article Modal Reader
window.openArticleModal = (articleId) => {
  const article = articles.find(a => a.id === articleId);
  if (!article) return;

  const modal = document.getElementById('times-article-modal');
  if (!modal) return;

  document.getElementById('modal-headline').textContent = article.title;
  document.getElementById('modal-subtitle').textContent = article.subtitle ? `"${article.subtitle}"` : '';
  document.getElementById('modal-category').textContent = article.category;
  document.getElementById('modal-read-time').textContent = article.readTime || '3 min read';
  document.getElementById('modal-author').textContent = article.author;
  document.getElementById('modal-author-role').textContent = article.authorRole || 'Student Journalist';
  document.getElementById('modal-author-avatar').textContent = (article.author || 'U').charAt(0).toUpperCase();
  document.getElementById('modal-date').textContent = article.date;

  const imgWrap = document.getElementById('modal-image-wrap');
  const img = document.getElementById('modal-image');
  const caption = document.getElementById('modal-image-caption');

  if (article.coverImage) {
    img.src = article.coverImage;
    caption.textContent = `Featured report photography • The UOS Times Archives / ${article.category}`;
    imgWrap.style.display = 'block';
  } else {
    imgWrap.style.display = 'none';
  }

  // Parse paragraphs and format with pull-quote
  const paragraphs = (article.content || article.excerpt).split('\n\n');
  const bodyHtml = paragraphs.map((p, idx) => {
    if (idx === 1 && article.subtitle) {
      return `
        <div class="times-pull-quote">
          "${article.subtitle}"
        </div>
        <p>${p}</p>
      `;
    }
    return `<p>${p}</p>`;
  }).join('');

  document.getElementById('modal-body').innerHTML = bodyHtml;

  const tagsContainer = document.getElementById('modal-tags');
  if (tagsContainer) {
    tagsContainer.innerHTML = (article.tags || []).map(t => `
      <span style="background: #F3F4F6; border: 1px solid #E5E7EB; padding: 0.2rem 0.5rem; font-family: var(--font-mono); font-size: 0.7rem; color: #374151;">
        #${t}
      </span>
    `).join('');
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeArticleModal = () => {
  const modal = document.getElementById('times-article-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.printArticle = () => {
  window.print();
};

// 5. Story Tip Submission Modal
window.openTipModal = () => {
  const modal = document.getElementById('times-tip-modal');
  if (modal) modal.classList.add('active');
};

window.closeTipModal = () => {
  const modal = document.getElementById('times-tip-modal');
  if (modal) modal.classList.remove('active');
};

function initTipForm() {
  const form = document.getElementById('times-tip-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const headline = document.getElementById('tip-headline').value;
      const category = document.getElementById('tip-category').value;

      alert(`✓ Thank you! Your news tip regarding "${headline}" has been transmitted to The UOS Times editorial desk (${category}). Our reporters will review your dispatch.`);
      form.reset();
      window.closeTipModal();
    };
  }
}
