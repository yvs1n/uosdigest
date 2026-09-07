/**
 * University of Sharjah - Admin Editorial Bureau Logic (Pure Vanilla JS)
 */

import { 
  getPublications, 
  savePublications, 
  addPublication,
  updatePublication,
  deletePublication,
  getFeaturedId, 
  setFeaturedId, 
  getSettings, 
  saveSettings, 
  getSubscribers, 
  updateSubscriber,
  deleteSubscriber,
  getJoinSubmissions, 
  updateJoinSubmission,
  updateJoinStatus, 
  deleteJoinSubmission,
  getPodcastSubmissions, 
  updatePodcastSubmission,
  updatePodcastStatus, 
  deletePodcastSubmission,
  getPolls, 
  savePolls,
  addPollQuestion,
  deletePollQuestion,
  getSurveyVoters,
  getTimesArticles,
  saveTimesArticles,
  addTimesArticle,
  updateTimesArticle,
  deleteTimesArticle,
  toggleTimesArticleFeatured,
  exportToCSV,
  initLiveSync
} from './storage.js';
import { uploadPdfToStorage, uploadImageToStorage } from './firebase.js';

let isAuthenticated = localStorage.getItem('uos_digest_admin_auth') === 'true';
let currentTab = 'publications';

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
  initPubFormHandler();
  initSubEditFormHandler();
  initTimesFormHandler();

  // Connect real-time Firestore sync to keep admin tables updated live
  initLiveSync(() => {
    if (isAuthenticated) {
      renderTabContent();
    }
  });
});

function initAdminDashboard() {
  const loginForm = document.getElementById('admin-login-form');
  const logoutBtn = document.getElementById('admin-logout-btn');

  renderAdminView();

  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('admin-email').value;
      const passInput = document.getElementById('admin-password').value;

      if (
        (emailInput.trim().toLowerCase() === 'press@sharjah.ac.ae' || emailInput.trim() === 'admin') &&
        (passInput === 'uospress2026' || passInput === 'uos2026' || passInput === 'admin')
      ) {
        isAuthenticated = true;
        localStorage.setItem('uos_digest_admin_auth', 'true');
        renderAdminView();
      } else {
        alert('Invalid administrative credentials. Use press@sharjah.ac.ae / uospress2026');
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      isAuthenticated = false;
      localStorage.removeItem('uos_digest_admin_auth');
      renderAdminView();
    };
  }
}

function renderAdminView() {
  const loginView = document.getElementById('admin-login-view');
  const dashView = document.getElementById('admin-dashboard-view');
  const headerActions = document.getElementById('admin-header-actions');

  if (!isAuthenticated) {
    if (loginView) loginView.style.display = 'flex';
    if (dashView) dashView.style.display = 'none';
    if (headerActions) headerActions.style.display = 'none';
  } else {
    if (loginView) loginView.style.display = 'none';
    if (dashView) dashView.style.display = 'flex';
    if (headerActions) headerActions.style.display = 'flex';
    renderTabContent();
  }
}

window.switchAdminTab = (tabName) => {
  currentTab = tabName;
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  renderTabContent();
};

function renderTabContent() {
  const contentArea = document.getElementById('admin-tab-content');
  if (!contentArea) return;

  const pubs = getPublications();
  const featuredId = getFeaturedId();
  const settings = getSettings();
  const subs = getSubscribers();
  const joins = getJoinSubmissions();
  const pods = getPodcastSubmissions();
  const polls = getPolls();
  const voters = getSurveyVoters();

  if (currentTab === 'publications') {
    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; border-bottom: 2px solid #111111; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-weight: 900; font-size: 1.5rem;">Publications Archive (${pubs.length})</h2>
          <p style="font-family: var(--font-mono); font-size: 0.75rem; color: #6B7280;">Add new issues with direct PDF upload or edit existing published editions</p>
        </div>
        <button class="btn-maroon" onclick="window.openAddPubModal()">+ Publish New Issue (Pop-up) ↗</button>
      </div>

      <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
        ${pubs.map(p => `
          <div style="padding: 1.25rem; border: 2px solid ${p.id === featuredId ? '#7A132B' : '#E2E0D8'}; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; gap: 1.25rem; align-items: center;">
              <img src="${p.coverImage}" alt="${p.title}" style="width: 4.5rem; height: 6rem; object-fit: cover; border: 1px solid #D1CFCA;" />
              <div>
                <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                  <span style="background: #7A132B; color: #FFFFFF; font-family: var(--font-mono); font-size: 0.65rem; font-weight: bold; padding: 0.2rem 0.5rem;">
                    ${p.publicationName} #${p.issueNumber}
                  </span>
                  ${p.id === featuredId ? '<span style="background: #C5A059; color: #111111; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 900; padding: 0.2rem 0.5rem;">★ FEATURED HERO COVER</span>' : ''}
                </div>
                <h3 style="font-weight: bold; font-size: 1.1rem; margin-top: 0.35rem;">${p.title}</h3>
                <p style="font-family: var(--font-serif); font-style: italic; font-size: 0.8rem; color: #4B5563;">"${p.subtitle || ''}"</p>
                <p style="font-family: var(--font-mono); font-size: 0.7rem; color: #6B7280; margin-top: 0.2rem;">${p.semester} • ${p.releaseDate} • ${p.pageCount} Pages</p>
                <p style="font-family: var(--font-mono); font-size: 0.65rem; color: #7A132B; margin-top: 0.25rem; max-width: 25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  PDF Stream: <strong>${p.pdfFileUrl || `/pdf/${p.id}.pdf`}</strong>
                </p>
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.75rem; flex-wrap: wrap;">
              <button class="btn-maroon" style="padding: 0.4rem 0.75rem;" onclick="window.openEditPubModal('${p.id}')">✏ Edit Issue</button>
              ${p.id !== featuredId ? `<button class="btn-white" onclick="window.pinFeaturedIssue('${p.id}')">Pin as Featured</button>` : ''}
              <button class="btn-white" style="color: #991B1B;" onclick="window.removePublication('${p.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (currentTab === 'times') {
    const timesArticles = getTimesArticles();
    const featuredArticle = timesArticles.find(a => a.featured) || timesArticles[0];
    const categories = Array.from(new Set(timesArticles.map(a => a.category)));

    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; border-bottom: 2px solid var(--uos-ink); flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="background: var(--uos-times-green); color: #FFFFFF; font-family: var(--font-mono); font-size: 0.65rem; font-weight: bold; padding: 0.15rem 0.5rem;">
              BROADSHEET NEWSROOM
            </span>
            <span style="font-family: var(--font-mono); font-size: 0.7rem; color: #6B7280;">Live Firebase Sync Enabled</span>
          </div>
          <h2 style="font-weight: 900; font-size: 1.65rem; font-family: var(--font-times);">The UOS Times Newsroom (${timesArticles.length})</h2>
          <p style="font-family: var(--font-mono); font-size: 0.75rem; color: #6B7280;">Publish new campus articles, investigations, op-eds, and manage the front-page lead story</p>
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <a href="times.html" target="_blank" class="btn-times-outline" style="padding: 0.65rem 1rem; font-size: 0.75rem;">
            Preview Broadsheet ↗
          </a>
          <button id="times-add-btn" class="btn-times" onclick="window.openAddTimesModal()" style="padding: 0.65rem 1.25rem;">
            + Write New Article ↗
          </button>
        </div>
      </div>

      <!-- Quick Metrics Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
        <div style="padding: 1rem; background: var(--uos-paper); border: 1px solid var(--uos-ink);">
          <span style="font-family: var(--font-mono); font-size: 0.65rem; color: #6B7280; text-transform: uppercase;">Total Published</span>
          <h4 style="font-weight: 900; font-size: 1.5rem; color: var(--uos-ink);">${timesArticles.length}</h4>
        </div>
        <div style="padding: 1rem; background: var(--uos-times-green-tint); border: 1px solid var(--uos-times-green);">
          <span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--uos-times-green-dark); text-transform: uppercase;">Front-Page Lead</span>
          <h4 style="font-weight: 900; font-size: 0.95rem; color: var(--uos-times-green-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${featuredArticle ? featuredArticle.title : 'None'}</h4>
        </div>
        <div style="padding: 1rem; background: var(--uos-paper); border: 1px solid var(--uos-ink);">
          <span style="font-family: var(--font-mono); font-size: 0.65rem; color: #6B7280; text-transform: uppercase;">Active Desks</span>
          <h4 style="font-weight: 900; font-size: 1.5rem; color: var(--uos-ink);">${categories.length}</h4>
        </div>
      </div>

      <!-- Articles Table -->
      <div style="border: 2px solid var(--uos-ink); background: #FFFFFF; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.75rem; text-align: left;">
          <thead>
            <tr style="background: var(--uos-paper-dark); border-bottom: 2px solid var(--uos-ink);">
              <th style="padding: 0.75rem 1rem; width: 4.5rem;">Cover</th>
              <th style="padding: 0.75rem 1rem;">Headline & Broadsheet Dek</th>
              <th style="padding: 0.75rem 1rem;">Desk Category</th>
              <th style="padding: 0.75rem 1rem;">Byline</th>
              <th style="padding: 0.75rem 1rem;">Date</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Front Lead</th>
              <th style="padding: 0.75rem 1rem; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${timesArticles.map(a => `
              <tr style="border-bottom: 1px solid var(--uos-border); ${a.featured ? 'background: #F0FDF4;' : ''}">
                <td style="padding: 0.75rem 1rem;">
                  ${a.coverImage ? `
                    <img src="${a.coverImage}" alt="${a.title}" style="width: 4rem; height: 3rem; object-fit: cover; border: 1px solid var(--uos-ink);" />
                  ` : `<div style="width: 4rem; height: 3rem; background: #E5E7EB; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #9CA3AF;">No Pic</div>`}
                </td>
                <td style="padding: 0.75rem 1rem; max-width: 20rem;">
                  <strong style="font-size: 0.85rem; font-family: var(--font-times); color: #111111; display: block; line-height: 1.25;">
                    ${a.title}
                  </strong>
                  ${a.subtitle ? `<span style="font-family: var(--font-bitter); font-style: italic; font-size: 0.72rem; color: #6B7280; display: block; margin-top: 0.2rem;">"${a.subtitle}"</span>` : ''}
                </td>
                <td style="padding: 0.75rem 1rem;">
                  <span class="times-category-pill" style="font-size: 0.65rem;">${a.category}</span>
                </td>
                <td style="padding: 0.75rem 1rem;">
                  <strong>${a.author}</strong>
                  ${a.authorRole ? `<span style="display: block; font-size: 0.65rem; color: #6B7280;">${a.authorRole}</span>` : ''}
                </td>
                <td style="padding: 0.75rem 1rem; color: #6B7280; white-space: nowrap;">
                  ${a.date}
                </td>
                <td style="padding: 0.75rem 1rem; text-align: center;">
                  <button 
                    onclick="window.toggleFeaturedTimesArticle('${a.id}')"
                    style="background: ${a.featured ? 'var(--uos-times-green)' : '#FFFFFF'}; color: ${a.featured ? '#FFFFFF' : '#6B7280'}; border: 1px solid ${a.featured ? 'var(--uos-times-green)' : '#D1CFCA'}; padding: 0.25rem 0.5rem; font-family: var(--font-mono); font-size: 0.65rem; cursor: pointer; font-weight: bold;"
                    title="${a.featured ? 'Lead article on front page' : 'Click to feature on front page'}"
                  >
                    ${a.featured ? '★ LEAD' : '☆ Standard'}
                  </button>
                </td>
                <td style="padding: 0.75rem 1rem; text-align: right; white-space: nowrap;">
                  <button class="btn-white" style="padding: 0.3rem 0.6rem; font-size: 0.7rem; margin-right: 0.35rem;" onclick="window.openEditTimesModal('${a.id}')">Edit</button>
                  <button class="btn-white" style="padding: 0.3rem 0.6rem; font-size: 0.7rem; color: #DC2626; border-color: #FCA5A5;" onclick="window.deleteTimesArticlePrompt('${a.id}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (currentTab === 'polls') {
    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; border-bottom: 2px solid #111111; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-weight: 900; font-size: 1.5rem;">Campus Pulse & Opinion Surveys (${polls.length})</h2>
          <p style="font-family: var(--font-mono); font-size: 0.75rem; color: #6B7280;">Manage survey questions and inspect verified student voter records</p>
        </div>
        <button class="btn-maroon" onclick="window.promptAddPollQuestion()">+ Add Survey Question</button>
      </div>

      <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
        ${polls.map((p, idx) => {
          const pollVoters = voters.filter(v => v.pollId === p.id);
          return `
            <div style="padding: 1.5rem; border: 2px solid #111111; background: #FFFFFF;">
              <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid #E2E0D8; padding-bottom: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <span style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: bold; color: #7A132B; text-transform: uppercase;">
                    Question ${idx + 1} • ${p.edition}
                  </span>
                  <h3 style="font-family: var(--font-serif); font-weight: bold; font-size: 1.25rem; margin-top: 0.25rem;">
                    "${p.question}"
                  </h3>
                  <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #6B7280;">
                    Total Verified Votes: <strong>${p.totalVotes}</strong> (${pollVoters.length} Name-Logged)
                  </span>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <button class="btn-white" style="font-size: 0.7rem;" onclick="window.resetPollVotesToZero('${p.id}')">
                    ↺ Reset Votes to 0
                  </button>
                  <button class="btn-white" style="color: #991B1B; font-size: 0.7rem;" onclick="window.removePollQuestion('${p.id}')">
                    Delete Question
                  </button>
                </div>
              </div>

              <!-- Options Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                ${p.options.map(opt => {
                  const pct = p.totalVotes > 0 ? Math.round((opt.votes / p.totalVotes) * 100) : 0;
                  return `
                    <div style="padding: 0.75rem; background: #FAF9F5; border: 1px solid #D1CFCA; font-family: var(--font-mono); font-size: 0.75rem;">
                      <div style="display: flex; justify-content: space-between;">
                        <strong style="color: #7A132B; font-size: 1.1rem;">${opt.votes}</strong>
                        <span style="color: #6B7280;">${pct}%</span>
                      </div>
                      <p style="font-family: var(--font-sans); font-weight: 600; color: #111111; margin-top: 0.25rem;">${opt.text}</p>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Logged Student Voters for this question -->
              <div style="background: var(--uos-paper); padding: 1rem; border: 1px solid var(--uos-border); font-family: var(--font-mono); font-size: 0.7rem;">
                <span style="font-weight: bold; color: var(--uos-maroon); display: block; margin-bottom: 0.5rem;">
                  Logged Student Submissions (${pollVoters.length}):
                </span>
                ${pollVoters.length ? `
                  <div style="display: flex; flex-direction: column; gap: 0.35rem; max-height: 8rem; overflow-y: auto;">
                    ${pollVoters.map(v => `
                      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #D1CFCA; padding-bottom: 0.25rem;">
                        <strong>${v.voterName}</strong>
                        <span style="color: #4B5563;">→ "${v.optionText}"</span>
                      </div>
                    `).join('')}
                  </div>
                ` : '<span style="color: #9CA3AF;">No specific voter names logged yet.</span>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (currentTab === 'forms') {
    contentArea.innerHTML = `
      <div style="padding-bottom: 1.5rem; border-bottom: 2px solid #111111;">
        <h2 style="font-weight: 900; font-size: 1.5rem;">Website Form Master Controls</h2>
        <p style="font-family: var(--font-mono); font-size: 0.75rem; color: #6B7280;">Live master toggles to pause or resume student submissions across the site</p>
      </div>

      <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
        <div style="padding: 1.25rem; background: #FFFFFF; border: 1px solid #E2E0D8; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-weight: bold; font-size: 1rem;">Newsletter Dispatch Subscription</h3>
            <span style="font-size: 0.75rem; color: #6B7280;">Registration card on footer</span>
          </div>
          <button class="btn-maroon" onclick="window.toggleSetting('newsletterEnabled')">
            ${settings.newsletterEnabled ? '● ACTIVE & OPEN' : '○ PAUSED'}
          </button>
        </div>

        <div style="padding: 1.25rem; background: #FFFFFF; border: 1px solid #E2E0D8; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-weight: bold; font-size: 1rem;">Press Club Recruitment & Pitching</h3>
            <span style="font-size: 0.75rem; color: #6B7280;">Writer and photographer applications</span>
          </div>
          <button class="btn-maroon" onclick="window.toggleSetting('joinClubEnabled')">
            ${settings.joinClubEnabled ? '● ACTIVE & OPEN' : '○ PAUSED'}
          </button>
        </div>

        <div style="padding: 1.25rem; background: #FFFFFF; border: 1px solid #E2E0D8; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-weight: bold; font-size: 1rem;">Ittisal Radio Studio Pitching</h3>
            <span style="font-size: 0.75rem; color: #6B7280;">Podcast sound lab recording bookings</span>
          </div>
          <button class="btn-maroon" onclick="window.toggleSetting('podcastApplyEnabled')">
            ${settings.podcastApplyEnabled ? '● ACTIVE & OPEN' : '○ PAUSED'}
          </button>
        </div>

        <div style="padding: 1.25rem; background: #FFFFFF; border: 1px solid #E2E0D8; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-weight: bold; font-size: 1rem;">Campus Voice Opinion Survey</h3>
            <span style="font-size: 0.75rem; color: #6B7280;">Student polling section</span>
          </div>
          <button class="btn-maroon" onclick="window.toggleSetting('campusVoiceEnabled')">
            ${settings.campusVoiceEnabled ? '● ACTIVE & OPEN' : '○ PAUSED'}
          </button>
        </div>
      </div>
    `;
  } else if (currentTab === 'subscribers') {
    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; border-bottom: 2px solid #111111; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-weight: 900; font-size: 1.5rem;">Newsletter Subscriber Directory (${subs.length})</h2>
          <p style="font-family: var(--font-mono); font-size: 0.75rem; color: #6B7280;">Directly edit subscriber information or export for university broadcast</p>
        </div>
        <button class="btn-maroon" onclick="window.exportSubscribers()">↓ Export CSV for Broadcast</button>
      </div>

      <div style="margin-top: 1.5rem; overflow-x: auto; background: #FFFFFF; border: 2px solid #111111;">
        <table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.75rem; text-align: left;">
          <thead style="background: #FAF9F5; border-bottom: 2px solid #111111;">
            <tr>
              <th style="padding: 0.85rem;">Name</th>
              <th style="padding: 0.85rem;">Email Address</th>
              <th style="padding: 0.85rem;">Topics of Interest</th>
              <th style="padding: 0.85rem;">Date Registered</th>
              <th style="padding: 0.85rem; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${subs.map(s => `
              <tr style="border-bottom: 1px solid #E2E0D8;">
                <td style="padding: 0.85rem; font-weight: bold;">${s.firstName} ${s.lastName || ''}</td>
                <td style="padding: 0.85rem; color: #7A132B; font-weight: bold;">${s.email}</td>
                <td style="padding: 0.85rem;">${s.selectedInterests.join(', ')}</td>
                <td style="padding: 0.85rem; color: #6B7280;">${new Date(s.date).toLocaleDateString()}</td>
                <td style="padding: 0.85rem; text-align: right;">
                  <button class="btn-white" style="font-size: 0.65rem; padding: 0.2rem 0.5rem; margin-right: 0.25rem;" onclick="window.openEditSubModal('${s.id}')">Edit</button>
                  <button class="btn-white" style="font-size: 0.65rem; padding: 0.2rem 0.5rem; color: #991B1B;" onclick="window.removeSub('${s.id}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (currentTab === 'applications') {
    contentArea.innerHTML = `
      <div style="padding-bottom: 1.5rem; border-bottom: 2px solid #111111;">
        <h2 style="font-weight: 900; font-size: 1.5rem;">Press Club Recruitment Applications (${joins.length})</h2>
        <p style="font-family: var(--font-mono); font-size: 0.75rem; color: #6B7280;">Select status (Approve, Decline, Waitlist) and launch instant personalized email links</p>
      </div>

      <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
        ${joins.map(j => `
          <div style="padding: 1.5rem; border: 2px solid #111111; background: #FFFFFF;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="font-weight: bold; font-size: 1.1rem;">${j.name} (${j.studentId || 'N/A'})</h3>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #7A132B; font-weight: bold;">
                  ${j.email} • Role: ${j.role}
                </span>
                <span style="font-family: var(--font-mono); font-size: 0.65rem; color: #9CA3AF; display: block; margin-top: 0.2rem;">
                  Submitted: ${new Date(j.date).toLocaleString()}
                </span>
              </div>

              <!-- Status Switcher -->
              <div style="display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.75rem;">
                <label style="font-weight: bold;">Status:</label>
                <select class="form-select" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onchange="window.changeJoinStatus('${j.id}', this.value)">
                  <option value="approved" ${j.status === 'approved' ? 'selected' : ''}>✅ Approved</option>
                  <option value="waitlist" ${j.status === 'waitlist' ? 'selected' : ''}>⏳ Waitlisted</option>
                  <option value="declined" ${j.status === 'declined' ? 'selected' : ''}>❌ Declined</option>
                  <option value="pending" ${j.status === 'pending' ? 'selected' : ''}>🕒 Pending Review</option>
                </select>
              </div>
            </div>

            <div style="font-size: 0.85rem; color: #374151; background: #FAF9F6; padding: 1rem; border: 1px solid #E2E0D8; margin-top: 0.5rem;">
              <strong>Story Pitch / Expression:</strong><br />
              "${j.pitch}"
            </div>

            <!-- Email Notification Action -->
            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #E2E0D8; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <span style="font-family: var(--font-mono); font-size: 0.7rem; color: #6B7280;">
                Current Status: <strong style="text-transform: uppercase; color: #7A132B;">${j.status}</strong>
              </span>

              <div style="display: flex; gap: 0.5rem;">
                <button class="btn-maroon" style="padding: 0.4rem 0.75rem; font-size: 0.75rem;" onclick="window.sendApplicantEmail('${j.id}')">
                  ✉ Send ${j.status.toUpperCase()} Decision Email ↗
                </button>
                <button class="btn-white" style="color: #991B1B; font-size: 0.7rem; padding: 0.4rem 0.6rem;" onclick="window.removeJoin('${j.id}')">
                  Delete
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (currentTab === 'podcasts') {
    contentArea.innerHTML = `
      <div style="padding-bottom: 1.5rem; border-bottom: 2px solid #111111;">
        <h2 style="font-weight: 900; font-size: 1.5rem;">Ittisal Radio Studio Pitches (${pods.length})</h2>
        <p style="font-family: var(--font-mono); font-size: 0.75rem; color: #6B7280;">Schedule, decline or postpone sound lab recording bookings with custom mailto actions</p>
      </div>

      <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
        ${pods.map(pod => `
          <div style="padding: 1.5rem; border: 2px solid #111111; background: #FFFFFF;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="font-weight: bold; font-size: 1.1rem;">${pod.name}</h3>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #7A132B; font-weight: bold;">
                  ${pod.email} • Preferred Date: ${pod.preferredDate || 'Flexible'}
                </span>
                <span style="font-family: var(--font-mono); font-size: 0.65rem; color: #9CA3AF; display: block; margin-top: 0.2rem;">
                  Submitted: ${new Date(pod.date).toLocaleString()}
                </span>
              </div>

              <!-- Status Switcher -->
              <div style="display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.75rem;">
                <label style="font-weight: bold;">Booking Status:</label>
                <select class="form-select" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onchange="window.changePodcastStatus('${pod.id}', this.value)">
                  <option value="scheduled" ${pod.status === 'scheduled' ? 'selected' : ''}>🎙️ Scheduled</option>
                  <option value="postponed" ${pod.status === 'postponed' ? 'selected' : ''}>⏳ Postponed</option>
                  <option value="declined" ${pod.status === 'declined' ? 'selected' : ''}>❌ Declined</option>
                  <option value="pending" ${pod.status === 'pending' ? 'selected' : ''}>🕒 Pending Review</option>
                </select>
              </div>
            </div>

            <div style="font-size: 0.85rem; color: #374151; background: #FAF9F6; padding: 1rem; border: 1px solid #E2E0D8; margin-top: 0.5rem;">
              <strong>Podcast Topic / Proposal:</strong><br />
              "${pod.topic}"
            </div>

            <!-- Email Notification Action -->
            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #E2E0D8; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <span style="font-family: var(--font-mono); font-size: 0.7rem; color: #6B7280;">
                Current Status: <strong style="text-transform: uppercase; color: #7A132B;">${pod.status}</strong>
              </span>

              <div style="display: flex; gap: 0.5rem;">
                <button class="btn-maroon" style="padding: 0.4rem 0.75rem; font-size: 0.75rem;" onclick="window.sendPodcastEmail('${pod.id}')">
                  ✉ Send ${pod.status.toUpperCase()} Studio Email ↗
                </button>
                <button class="btn-white" style="color: #991B1B; font-size: 0.7rem; padding: 0.4rem 0.6rem;" onclick="window.removePodcast('${pod.id}')">
                  Delete
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// 1. Publication Modal Handlers (Publish New & Edit Issue)
window.openAddPubModal = () => {
  const modal = document.getElementById('admin-pub-modal');
  const titleEl = document.getElementById('pub-modal-title');
  const idEl = document.getElementById('pub-form-id');

  if (modal) {
    if (titleEl) titleEl.textContent = 'Publish New Issue';
    if (idEl) idEl.value = '';
    document.getElementById('pub-form-title').value = '';
    document.getElementById('pub-form-subtitle').value = '';
    document.getElementById('pub-form-number').value = getPublications().length + 1;
    document.getElementById('pub-form-type').value = 'magazine';
    document.getElementById('pub-form-semester').value = 'Spring Semester';
    document.getElementById('pub-form-date').value = 'March 2026';
    document.getElementById('pub-form-cover').value = '';
    document.getElementById('pub-form-pages').value = '32';
    document.getElementById('pub-form-pdf-path').value = '/pdf/uos digest issue 3 for print.pdf';
    document.getElementById('pub-form-desc').value = 'Published by The Press Club Bureau, College of Communication, University of Sharjah.';
    document.getElementById('pub-form-highlights').value = 'Lead investigative report\nStudent visual folio\nCampus column';

    modal.classList.add('active');
  }
};

window.openEditPubModal = (pubId) => {
  const pubs = getPublications();
  const pub = pubs.find(p => p.id === pubId);
  if (!pub) return;

  const modal = document.getElementById('admin-pub-modal');
  const titleEl = document.getElementById('pub-modal-title');
  const idEl = document.getElementById('pub-form-id');

  if (modal) {
    if (titleEl) titleEl.textContent = `Edit Issue: ${pub.title}`;
    if (idEl) idEl.value = pub.id;
    document.getElementById('pub-form-title').value = pub.title;
    document.getElementById('pub-form-subtitle').value = pub.subtitle || '';
    document.getElementById('pub-form-number').value = pub.issueNumber;
    document.getElementById('pub-form-type').value = pub.type;
    document.getElementById('pub-form-semester').value = pub.semester;
    document.getElementById('pub-form-date').value = pub.releaseDate;
    document.getElementById('pub-form-cover').value = pub.coverImage;
    document.getElementById('pub-form-pages').value = pub.pageCount;
    document.getElementById('pub-form-pdf-path').value = pub.pdfFileUrl || `/pdf/${pub.id}.pdf`;
    document.getElementById('pub-form-desc').value = pub.description;
    document.getElementById('pub-form-highlights').value = (pub.highlights || []).join('\n');

    modal.classList.add('active');
  }
};

window.closePubModal = () => {
  const modal = document.getElementById('admin-pub-modal');
  if (modal) modal.classList.remove('active');
};

function initPubFormHandler() {
  const form = document.getElementById('pub-form');
  const fileUpload = document.getElementById('pub-form-file-upload');
  const coverFileUpload = document.getElementById('pub-form-cover-file');
  const pathInput = document.getElementById('pub-form-pdf-path');
  const coverInput = document.getElementById('pub-form-cover');
  const progressContainer = document.getElementById('pub-upload-progress');
  const progressBar = document.getElementById('pub-upload-bar');
  const progressStatus = document.getElementById('pub-upload-status');
  const progressPercent = document.getElementById('pub-upload-percent');
  const submitBtn = document.getElementById('pub-form-submit-btn');

  if (fileUpload) {
    fileUpload.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file && pathInput) {
        pathInput.placeholder = `Selected: ${file.name} (will upload to Firebase Storage)`;
      }
    };
  }

  if (coverFileUpload) {
    coverFileUpload.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file && coverInput) {
        coverInput.placeholder = `Selected: ${file.name} (will upload to Firebase Storage)`;
      }
    };
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      const id = document.getElementById('pub-form-id').value;
      const title = document.getElementById('pub-form-title').value;
      const subtitle = document.getElementById('pub-form-subtitle').value;
      const issueNumber = Number(document.getElementById('pub-form-number').value);
      const type = document.getElementById('pub-form-type').value;
      const semester = document.getElementById('pub-form-semester').value;
      const releaseDate = document.getElementById('pub-form-date').value;
      let coverImage = document.getElementById('pub-form-cover').value || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80';
      const pageCount = Number(document.getElementById('pub-form-pages').value) || 32;
      let pdfFileUrl = document.getElementById('pub-form-pdf-path').value || '/pdf/uos digest issue 3 for print.pdf';
      const description = document.getElementById('pub-form-desc').value;
      const highlights = document.getElementById('pub-form-highlights').value.split('\n').filter(Boolean);

      // 1. Upload Cover Image to Firebase Storage if selected
      const coverFile = coverFileUpload?.files?.[0];
      if (coverFile) {
        try {
          if (progressContainer) progressContainer.style.display = 'block';
          if (submitBtn) submitBtn.disabled = true;
          if (progressStatus) progressStatus.textContent = 'Uploading Cover Image to Firebase Cloud Storage...';
          coverImage = await uploadImageToStorage(coverFile, (pct) => {
            if (progressBar) progressBar.value = pct;
            if (progressPercent) progressPercent.textContent = `${pct}%`;
          });
        } catch (err) {
          console.warn('Cover upload note:', err);
        }
      }

      // 2. Upload PDF File to Firebase Storage if selected
      const pdfFile = fileUpload?.files?.[0];
      if (pdfFile) {
        try {
          if (progressContainer) progressContainer.style.display = 'block';
          if (submitBtn) submitBtn.disabled = true;
          if (progressStatus) progressStatus.textContent = 'Uploading PDF Document to Firebase Cloud Storage...';
          pdfFileUrl = await uploadPdfToStorage(pdfFile, (pct) => {
            if (progressBar) progressBar.value = pct;
            if (progressPercent) progressPercent.textContent = `${pct}%`;
          });
        } catch (err) {
          alert('Firebase Cloud Storage Notice: ' + err.message + '\nUsing local reference instead.');
        }
      }

      // Reset progress indicator
      if (progressContainer) progressContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;

      const pubData = {
        title,
        subtitle,
        issueNumber,
        type,
        publicationName: type === 'magazine' ? 'UOS Digest' : 'The UOS Times',
        semester,
        academicYear: '2025–2026',
        releaseDate,
        coverImage,
        pageCount,
        pdfFileUrl,
        description,
        highlights,
        tags: ['Culture', 'Journalism', 'University of Sharjah']
      };

      if (id) {
        updatePublication({ ...pubData, id });
      } else {
        addPublication({ ...pubData, id: `uos-${type}-issue-${issueNumber}-${Date.now().toString().slice(-4)}` });
      }

      window.closePubModal();
      renderTabContent();
    };
  }
}

// 2. Subscriber Modal Handlers
window.openEditSubModal = (subId) => {
  const subs = getSubscribers();
  const sub = subs.find(s => s.id === subId);
  if (!sub) return;

  const modal = document.getElementById('admin-sub-modal');
  if (modal) {
    document.getElementById('sub-edit-id').value = sub.id;
    document.getElementById('sub-edit-first').value = sub.firstName;
    document.getElementById('sub-edit-last').value = sub.lastName || '';
    document.getElementById('sub-edit-email').value = sub.email;
    document.getElementById('sub-edit-interests').value = sub.selectedInterests.join(', ');
    modal.classList.add('active');
  }
};

window.closeSubModal = () => {
  const modal = document.getElementById('admin-sub-modal');
  if (modal) modal.classList.remove('active');
};

function initSubEditFormHandler() {
  const form = document.getElementById('sub-edit-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('sub-edit-id').value;
      const firstName = document.getElementById('sub-edit-first').value;
      const lastName = document.getElementById('sub-edit-last').value;
      const email = document.getElementById('sub-edit-email').value;
      const interests = document.getElementById('sub-edit-interests').value.split(',').map(i => i.trim()).filter(Boolean);

      updateSubscriber({ id, firstName, lastName, email, selectedInterests: interests });
      window.closeSubModal();
      renderTabContent();
    };
  }
}

window.removeSub = (id) => {
  if (confirm('Remove this subscriber from the mailing list?')) {
    deleteSubscriber(id);
    renderTabContent();
  }
};

// 3. Applications Status & Custom Mailto Actions
window.changeJoinStatus = (id, newStatus) => {
  updateJoinStatus(id, newStatus);
  renderTabContent();
};

window.removeJoin = (id) => {
  if (confirm('Delete this application record?')) {
    deleteJoinSubmission(id);
    renderTabContent();
  }
};

window.sendApplicantEmail = (id) => {
  const joins = getJoinSubmissions();
  const j = joins.find(item => item.id === id);
  if (!j) return;

  let subject = '';
  let body = '';

  if (j.status === 'approved') {
    subject = `University of Sharjah Press Club Application — Approved`;
    body = `Dear ${j.name},\n\nWe are delighted to inform you that your application for the role of ${j.role} at The Press Club, College of Communication, has been APPROVED.\n\nWe would love to invite you to our editorial bureau onboarding briefing:\n• Location: College of Communication (M-10 Bureau)\n• Role: ${j.role}\n\nPlease reply to this email to confirm your attendance.\n\nWarm regards,\nPress Club Editorial Board\nUniversity of Sharjah\npress@sharjah.ac.ae`;
  } else if (j.status === 'waitlist') {
    subject = `University of Sharjah Press Club Application — Waitlist Update`;
    body = `Dear ${j.name},\n\nThank you for applying to The Press Club, College of Communication. We received an exceptionally high volume of applicants for ${j.role}.\n\nYour application has been placed on our PRIORITY WAITLIST for the upcoming edition cycle. We will reach out as soon as an opening becomes available.\n\nWarm regards,\nPress Club Editorial Board\nUniversity of Sharjah`;
  } else if (j.status === 'declined') {
    subject = `University of Sharjah Press Club Application Update`;
    body = `Dear ${j.name},\n\nThank you for taking the time to apply and pitch to The Press Club. After careful review, we regret to inform you that we are unable to offer you a bureau position for this recruitment cycle.\n\nWe encourage you to submit freelance pitches and student articles for our campus letters and photo folios.\n\nWarm regards,\nPress Club Editorial Board\nUniversity of Sharjah`;
  } else {
    subject = `University of Sharjah Press Club Application Review`;
    body = `Dear ${j.name},\n\nThank you for your pitch regarding: "${j.pitch}". Our editors are currently reviewing your submission and will get in touch with you shortly.\n\nBest regards,\nPress Club Bureau`;
  }

  const mailtoUrl = `mailto:${encodeURIComponent(j.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
};

// 4. Radio Pitches Status & Custom Mailto Actions
window.changePodcastStatus = (id, newStatus) => {
  updatePodcastStatus(id, newStatus);
  renderTabContent();
};

window.removePodcast = (id) => {
  if (confirm('Delete this podcast pitch record?')) {
    deletePodcastSubmission(id);
    renderTabContent();
  }
};

window.sendPodcastEmail = (id) => {
  const pods = getPodcastSubmissions();
  const pod = pods.find(item => item.id === id);
  if (!pod) return;

  let subject = '';
  let body = '';

  if (pod.status === 'scheduled') {
    subject = `Ittisal Radio Studio Booking Confirmed — ${pod.topic.slice(0, 30)}...`;
    body = `Dear ${pod.name},\n\nYour podcast studio proposal has been SCHEDULED at the College of Communication Sound Lab.\n\n• Target Recording Date: ${pod.preferredDate || 'Upcoming Academic Week'}\n• Topic: "${pod.topic}"\n• Studio Location: Ittisal Audio Suite, College of Communication\n\nPlease arrive 15 minutes early to test microphone audio levels.\n\nBest regards,\nIttisal Radio Production Team\nCollege of Communication, University of Sharjah`;
  } else if (pod.status === 'postponed') {
    subject = `Ittisal Radio Studio Booking — Postponement Notice`;
    body = `Dear ${pod.name},\n\nRegarding your podcast proposal for "${pod.topic}", our sound recording booth is currently undergoing maintenance and high-priority broadcasts.\n\nYour session has been postponed to next week. Please reply with your updated weekly availability.\n\nBest,\nIttisal Radio Team`;
  } else if (pod.status === 'declined') {
    subject = `Ittisal Radio Studio Pitch Update`;
    body = `Dear ${pod.name},\n\nThank you for proposing your podcast concept to Ittisal Radio. Due to schedule constraints for this academic term, we are unable to book a recording session for this topic at this time.\n\nWe look forward to reviewing your proposals in future cycles.\n\nBest,\nIttisal Radio Team`;
  } else {
    subject = `Ittisal Radio Studio Pitch Under Review`;
    body = `Dear ${pod.name},\n\nWe have received your podcast topic proposal: "${pod.topic}". Our studio audio engineer is reviewing the schedule.\n\nBest,\nIttisal Radio Team`;
  }

  const mailtoUrl = `mailto:${encodeURIComponent(pod.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
};

// 5. General Actions
window.pinFeaturedIssue = (id) => {
  setFeaturedId(id);
  renderTabContent();
};

window.removePublication = (id) => {
  if (confirm('Delete this publication from the university archive?')) {
    deletePublication(id);
    renderTabContent();
  }
};

window.toggleSetting = (key) => {
  const settings = getSettings();
  settings[key] = !settings[key];
  saveSettings(settings);
  renderTabContent();
};

window.exportSubscribers = () => {
  const subs = getSubscribers();
  const rows = subs.map(s => ({
    'First Name': s.firstName,
    'Last Name': s.lastName || '',
    'Email Address': s.email,
    'Interests': s.selectedInterests.join('; '),
    'Date Registered': new Date(s.date).toLocaleDateString()
  }));
  exportToCSV(`UOS_Digest_Subscribers_${new Date().toISOString().slice(0,10)}`, rows);
};

window.promptAddPollQuestion = () => {
  const question = prompt('Enter Survey Question:');
  if (!question) return;
  const edition = prompt('Enter Edition Tag (e.g. Edition #4 Community Pulse):', 'Edition #4 Community Pulse');
  const opt1 = prompt('Enter Option 1:');
  const opt2 = prompt('Enter Option 2:');
  const opt3 = prompt('Enter Option 3 (Optional):');

  if (!opt1 || !opt2) {
    alert('You must provide at least 2 options.');
    return;
  }

  const options = [
    { id: 'opt-' + Date.now() + '-1', text: opt1.trim(), votes: 0 },
    { id: 'opt-' + Date.now() + '-2', text: opt2.trim(), votes: 0 }
  ];
  if (opt3 && opt3.trim()) {
    options.push({ id: 'opt-' + Date.now() + '-3', text: opt3.trim(), votes: 0 });
  }

  addPollQuestion({
    question: question.trim(),
    edition: edition || 'Active Campus Survey',
    options
  });
  renderTabContent();
};

window.removePollQuestion = (pollId) => {
  if (confirm('Remove this survey question?')) {
    deletePollQuestion(pollId);
    renderTabContent();
  }
};

window.resetPollVotesToZero = (pollId) => {
  if (confirm('Reset all votes for this question to zero and clear its voter history?')) {
    const polls = getPolls();
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
      poll.options = poll.options.map(o => ({ ...o, votes: 0 }));
      poll.totalVotes = 0;
      savePolls(polls);

      const voters = getSurveyVoters().filter(v => v.pollId !== pollId);
      localStorage.setItem('uos_digest_survey_voters_v2', JSON.stringify(voters));
      
      // Clear any local voted flags for this poll
      localStorage.removeItem(`uos_voted_${pollId}`);
      localStorage.removeItem(`uos_voter_name_${pollId}`);

      renderTabContent();
    }
  }
};

// ==========================================================================
// The UOS Times Newsroom Article Handlers (Local + Firebase Sync)
// ==========================================================================

window.openAddTimesModal = () => {
  const modal = document.getElementById('admin-times-modal');
  const titleEl = document.getElementById('times-modal-title');
  const idEl = document.getElementById('times-form-id');

  if (modal) {
    if (titleEl) titleEl.textContent = 'Publish New Broadsheet Article';
    if (idEl) idEl.value = '';
    document.getElementById('times-form-title').value = '';
    document.getElementById('times-form-subtitle').value = '';
    document.getElementById('times-form-category').value = 'Campus News';
    document.getElementById('times-form-readtime').value = '3 min read';
    document.getElementById('times-form-author').value = 'UOS News Bureau';
    document.getElementById('times-form-role').value = 'Staff Reporter';
    document.getElementById('times-form-date').value = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('times-form-image-url').value = '';
    document.getElementById('times-form-image-file').value = '';
    document.getElementById('times-form-excerpt').value = '';
    document.getElementById('times-form-content').value = '';
    document.getElementById('times-form-tags').value = '';
    document.getElementById('times-form-featured').checked = false;

    modal.classList.add('active');
  }
};

window.openEditTimesModal = (articleId) => {
  const articles = getTimesArticles();
  const art = articles.find(a => a.id === articleId);
  if (!art) return;

  const modal = document.getElementById('admin-times-modal');
  const titleEl = document.getElementById('times-modal-title');
  const idEl = document.getElementById('times-form-id');

  if (modal) {
    if (titleEl) titleEl.textContent = `Edit Article: ${art.title}`;
    if (idEl) idEl.value = art.id;
    document.getElementById('times-form-title').value = art.title;
    document.getElementById('times-form-subtitle').value = art.subtitle || '';
    document.getElementById('times-form-category').value = art.category || 'Campus News';
    document.getElementById('times-form-readtime').value = art.readTime || '3 min read';
    document.getElementById('times-form-author').value = art.author || '';
    document.getElementById('times-form-role').value = art.authorRole || '';
    document.getElementById('times-form-date').value = art.date || '';
    document.getElementById('times-form-image-url').value = art.coverImage || '';
    document.getElementById('times-form-image-file').value = '';
    document.getElementById('times-form-excerpt').value = art.excerpt || '';
    document.getElementById('times-form-content').value = art.content || art.excerpt || '';
    document.getElementById('times-form-tags').value = (art.tags || []).join(', ');
    document.getElementById('times-form-featured').checked = !!art.featured;

    modal.classList.add('active');
  }
};

window.closeTimesModal = () => {
  const modal = document.getElementById('admin-times-modal');
  if (modal) modal.classList.remove('active');
};

window.deleteTimesArticlePrompt = (articleId) => {
  if (confirm('Are you sure you want to delete this article from The UOS Times newsroom?')) {
    deleteTimesArticle(articleId);
    renderTabContent();
  }
};

window.toggleFeaturedTimesArticle = (articleId) => {
  toggleTimesArticleFeatured(articleId);
  renderTabContent();
};

function initTimesFormHandler() {
  const form = document.getElementById('times-article-form');
  const fileInput = document.getElementById('times-form-image-file');
  const urlInput = document.getElementById('times-form-image-url');
  const submitBtn = document.getElementById('times-form-submit-btn');

  if (fileInput) {
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Uploading Cover Image...';
        }
        try {
          const downloadUrl = await uploadImageToStorage(file);
          if (urlInput) urlInput.value = downloadUrl;
        } catch (err) {
          console.warn('Image upload error:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save & Publish to Newsroom ↗';
          }
        }
      }
    };
  }

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('times-form-id').value;
      const title = document.getElementById('times-form-title').value.trim();
      const subtitle = document.getElementById('times-form-subtitle').value.trim();
      const category = document.getElementById('times-form-category').value;
      const readTime = document.getElementById('times-form-readtime').value.trim();
      const author = document.getElementById('times-form-author').value.trim();
      const authorRole = document.getElementById('times-form-role').value.trim();
      const date = document.getElementById('times-form-date').value.trim() || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const coverImage = document.getElementById('times-form-image-url').value.trim() || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80';
      const excerpt = document.getElementById('times-form-excerpt').value.trim();
      const content = document.getElementById('times-form-content').value.trim();
      const tagsStr = document.getElementById('times-form-tags').value;
      const featured = document.getElementById('times-form-featured').checked;

      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      const articlePayload = {
        title,
        subtitle,
        category,
        readTime,
        author,
        authorRole,
        date,
        coverImage,
        excerpt,
        content,
        tags,
        featured
      };

      if (id) {
        updateTimesArticle({ id, ...articlePayload });
        alert(`✓ Article "${title}" updated successfully! Changes are synchronized with Firebase.`);
      } else {
        addTimesArticle(articlePayload);
        alert(`✓ New article "${title}" published to The UOS Times newsroom! Changes are synchronized with Firebase.`);
      }

      window.closeTimesModal();
      renderTabContent();
    };
  }
}

