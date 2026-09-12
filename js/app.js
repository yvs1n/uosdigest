/**
 * University of Sharjah - Main Application Interactivity (Pure Vanilla JS)
 */

import { 
  getPublications, 
  getFeaturedId, 
  getSettings, 
  getSubscribers, 
  addSubscriber, 
  getPolls, 
  savePolls,
  getSurveyVoters,
  addSurveyVoter,
  addJoinSubmission,
  addPodcastSubmission,
  getRadioEpisodes,
  initLiveSync
} from './storage.js';
import { initialTeamMembers, initialInstagramPosts } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  initLiveDate();
  renderHeroAndPublications();
  initInstagramSection();
  initRadioSection();
  initCampusVoiceSection();
  renderTeamSection();
  initNewsletterForm();
  initModals();
  checkUrlParams();

  // Connect real-time Firestore cloud synchronization
  initLiveSync((category) => {
    if (category === 'polls' || category === 'survey_voters') {
      initCampusVoiceSection();
    } else if (category === 'publications' || category === 'featured_id') {
      renderHeroAndPublications();
    } else if (category === 'radio_episodes') {
      initRadioSection();
    } else if (category === 'settings') {
      initNewsletterForm();
      initCampusVoiceSection();
    }
  });
});

// 1. Live Institutional Date
function initLiveDate() {
  const dateEl = document.getElementById('institutional-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// 2. Render Hero & Publications
export function renderHeroAndPublications() {
  const pubs = getPublications();
  const featuredId = getFeaturedId();
  const featured = pubs.find(p => p.id === featuredId) || pubs[0];

  // Update Hero
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroDesc = document.getElementById('hero-desc');
  const heroCover = document.getElementById('hero-cover-img');
  const heroBadge = document.getElementById('hero-edition-badge');
  const heroVolume = document.getElementById('hero-volume-badge');
  const heroPages = document.getElementById('hero-pages-badge');
  const heroHighlights = document.getElementById('hero-highlights');
  const heroReadBtn = document.getElementById('hero-read-btn');
  const heroDownloadBtn = document.getElementById('hero-download-btn');
  const heroCoverCard = document.getElementById('hero-cover-card');

  if (heroTitle) heroTitle.textContent = featured.title;
  if (heroSubtitle) heroSubtitle.textContent = featured.subtitle ? `"${featured.subtitle}"` : '';
  if (heroDesc) heroDesc.textContent = featured.description;
  if (heroCover) {
    heroCover.src = featured.coverImage;
    heroCover.alt = featured.title;
  }
  if (heroBadge) heroBadge.textContent = featured.publicationName;
  if (heroVolume) heroVolume.textContent = `Issue #${featured.issueNumber}`;
  if (heroPages) heroPages.textContent = `${featured.pageCount} Pages`;

  if (heroHighlights) {
    heroHighlights.innerHTML = featured.highlights.map((h, i) => `
      <div style="background-color: #FFFFFF; border: 1px solid #E2E0D8; padding: 0.65rem; display: flex; gap: 0.5rem;">
        <span style="color: #7A132B; font-weight: bold;">0${i + 1}.</span>
        <span style="color: #111111; font-size: 0.75rem;">${h}</span>
      </div>
    `).join('');
  }

  if (heroReadBtn) {
    heroReadBtn.onclick = () => openReader(featured);
  }
  if (heroCoverCard) {
    heroCoverCard.onclick = () => window.openCoverFullscreen(featured);
  }
  if (heroDownloadBtn) {
    heroDownloadBtn.href = featured.pdfFileUrl || `/pdf/${featured.id}.pdf`;
    heroDownloadBtn.setAttribute('download', `${featured.title}.pdf`);
  }

  // Update Publications Grid
  const gridContainer = document.getElementById('publications-grid');
  if (gridContainer) {
    gridContainer.innerHTML = pubs.map(p => `
      <div class="pub-card">
        <div class="pub-cover-wrap" onclick="window.openPublicationReader('${p.id}')">
          <img src="${p.coverImage}" alt="${p.title}" class="pub-cover-img" />
          <span style="position: absolute; top: 0.5rem; left: 0.5rem; background-color: #7A132B; color: #FFFFFF; font-family: var(--font-mono); font-size: 0.65rem; font-weight: bold; padding: 0.2rem 0.5rem;">
            ${p.publicationName} #${p.issueNumber}
          </span>
        </div>

        <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.4rem;">
          <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.65rem; color: #6B7280;">
            <span>${p.semester}</span>
            <span>${p.pageCount} P.</span>
          </div>

          <h3 style="font-weight: bold; font-size: 1rem; color: #111111; line-height: 1.2;">
            ${p.title}
          </h3>

          ${p.subtitle ? `<p class="pub-subtitle" style="font-size: 0.78rem; color: #4B5563;">"${p.subtitle}"</p>` : ''}

          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #E2E0D8; display: flex; justify-content: space-between; align-items: center;">
            <button class="btn-maroon" style="padding: 0.4rem 0.75rem; font-size: 0.7rem;" onclick="window.openPublicationReader('${p.id}')">
              Read PDF ↗
            </button>
            <a href="${p.pdfFileUrl || `/pdf/${p.id}.pdf`}" download="${p.title}.pdf" style="font-family: var(--font-mono); font-size: 0.7rem; color: #7A132B; text-decoration: none; font-weight: bold;">
              Download ↓
            </a>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Global hook for publication cards
window.openPublicationReader = (pubId) => {
  const pubs = getPublications();
  const found = pubs.find(p => p.id === pubId);
  if (found) openReader(found);
};

// 3. Completely Custom Local Document PDF Reader
let currentReaderPub = null;

export function openReader(pub) {
  currentReaderPub = pub;
  const modal = document.getElementById('reader-modal');
  if (!modal) return;

  const pubs = getPublications();

  // Header
  document.getElementById('reader-title').textContent = pub.title;
  document.getElementById('reader-issue-badge').textContent = `#${pub.issueNumber}`;
  document.getElementById('reader-subtitle').textContent = pub.subtitle ? `"${pub.subtitle}"` : '';

  // Left Sidebar Specification
  const specTitle = document.getElementById('reader-spec-title');
  const specTheme = document.getElementById('reader-spec-theme');
  const specTerm = document.getElementById('reader-spec-term');
  const specDate = document.getElementById('reader-spec-date');
  const specPages = document.getElementById('reader-spec-pages');
  const specPath = document.getElementById('reader-spec-path');
  const specDesc = document.getElementById('reader-spec-desc');
  const specHighlights = document.getElementById('reader-spec-highlights');

  if (specTitle) specTitle.textContent = pub.title;
  if (specTheme) specTheme.textContent = pub.subtitle ? `"${pub.subtitle}"` : (pub.theme || '');
  if (specTerm) specTerm.textContent = `${pub.semester} (${pub.academicYear || '2025–2026'})`;
  if (specDate) specDate.textContent = pub.releaseDate || 'February 2026';
  if (specPages) specPages.textContent = `${pub.pageCount} Pages`;
  if (specPath) specPath.textContent = pub.pdfFileUrl || `/pdf/${pub.id}.pdf`;
  if (specDesc) specDesc.textContent = pub.description || 'Published by The Press Club Bureau, College of Communication.';

  if (specHighlights) {
    specHighlights.innerHTML = (pub.highlights || []).map((h, i) => `
      <div style="background: #FFFFFF; border: 1px solid #E2E0D8; padding: 0.4rem; color: #111111;">
        <span style="color: #7A132B; font-weight: bold;">0${i + 1}.</span> ${h}
      </div>
    `).join('');
  }

  // Issue Switcher Selector in Toolbar
  const issueSelect = document.getElementById('reader-issue-select');
  if (issueSelect) {
    issueSelect.innerHTML = pubs.map(p => `
      <option value="${p.id}" ${p.id === pub.id ? 'selected' : ''}>
        ${p.publicationName} #${p.issueNumber} (${p.releaseDate || p.semester})
      </option>
    `).join('');

    issueSelect.onchange = (e) => {
      const selected = pubs.find(p => p.id === e.target.value);
      if (selected) openReader(selected);
    };
  }

  // Document Streaming
  const pdfUrl = pub.pdfFileUrl || `/pdf/${pub.id}.pdf`;
  const streamIframe = document.getElementById('reader-iframe');
  const streamObject = document.getElementById('reader-object');
  const downloadLink = document.getElementById('reader-download-link');

  if (streamObject) streamObject.data = pdfUrl;
  if (streamIframe) streamIframe.src = pdfUrl;
  if (downloadLink) {
    downloadLink.href = pdfUrl;
    downloadLink.setAttribute('download', `${pub.title}.pdf`);
  }

  modal.classList.add('active');
}

export function closeReader() {
  const modal = document.getElementById('reader-modal');
  if (modal) modal.classList.remove('active');
}

window.closeReaderModal = closeReader;

window.toggleReaderFullscreen = () => {
  const modal = document.getElementById('reader-modal');
  if (!document.fullscreenElement) {
    modal.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};

// Fullscreen Cover Lightbox Modal
let currentCoverPub = null;

window.openCoverFullscreen = (pub) => {
  const targetPub = pub || currentReaderPub || getPublications().find(p => p.featured) || getPublications()[0];
  if (!targetPub) return;
  currentCoverPub = targetPub;

  const modal = document.getElementById('cover-modal');
  const img = document.getElementById('cover-modal-img');
  const title = document.getElementById('cover-modal-title');
  const subtitle = document.getElementById('cover-modal-subtitle');
  const readBtn = document.getElementById('cover-modal-read-btn');
  const downloadBtn = document.getElementById('cover-modal-download-btn');

  if (img) {
    img.src = targetPub.coverImage;
    img.alt = targetPub.title;
  }
  if (title) title.textContent = targetPub.title;
  if (subtitle) subtitle.textContent = targetPub.subtitle ? `"${targetPub.subtitle}"` : '';
  if (readBtn) {
    readBtn.onclick = () => {
      window.closeCoverModal();
      openReader(targetPub);
    };
  }
  if (downloadBtn) {
    downloadBtn.href = targetPub.pdfFileUrl || `/pdf/${targetPub.id}.pdf`;
    downloadBtn.setAttribute('download', `${targetPub.title}.pdf`);
  }

  if (modal) modal.classList.add('active');
};

window.closeCoverModal = () => {
  const modal = document.getElementById('cover-modal');
  if (modal) modal.classList.remove('active');
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
};

window.triggerBrowserFullscreen = () => {
  const modal = document.getElementById('cover-modal');
  if (!modal) return;
  if (!document.fullscreenElement) {
    modal.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeCoverModal();
    window.closeReaderModal();
  }
});

window.toggleMobileMenu = () => {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (drawer) drawer.classList.toggle('active');
};

window.toggleReaderSidebar = () => {
  const sidebar = document.getElementById('reader-sidebar');
  if (sidebar) {
    sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
  }
};

// 3. Instagram Social Dispatch (@uosdigest)
async function initInstagramSection() {
  const grid = document.getElementById('instagram-posts-grid');
  if (!grid) return;

  let posts = initialInstagramPosts;
  try {
    const res = await fetch('./data/instagram.json?t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        posts = data;
      }
    }
  } catch (e) {
    console.warn('Using fallback Instagram seed posts:', e);
  }

  grid.innerHTML = posts.map(p => {
    const dateStr = p.timestamp ? new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
    const likesDisplay = p.likes ? `<span>❤️ ${p.likes}</span>` : '';
    const commentsDisplay = p.comments ? `<span>💬 ${p.comments}</span>` : '';

    return `
      <a href="${p.permalink || 'https://www.instagram.com/uosdigest'}" target="_blank" rel="noopener noreferrer" class="ig-card">
        <div class="ig-card-img-wrap">
          <img src="${p.imageUrl}" alt="${p.caption ? p.caption.replace(/"/g, '&quot;') : 'Instagram Post'}" class="ig-card-img" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80';" />
          <div class="ig-card-badge">
            <span>📸 @uosdigest</span>
          </div>
        </div>
        <div class="ig-card-body">
          <div>
            <div class="ig-card-meta">
              <span>${dateStr}</span>
              <div style="display: flex; gap: 0.5rem;">
                ${likesDisplay}
                ${commentsDisplay}
              </div>
            </div>
            <p class="ig-card-caption">
              ${p.caption}
            </p>
          </div>
          <div class="ig-card-footer">
            <span>VIEW ON INSTAGRAM</span>
            <span>↗</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

// 4. Ittisal Radio Audio Console & Spotify Links
function initRadioSection() {
  const audio = document.getElementById('radio-audio-element');
  const playBtn = document.getElementById('radio-play-btn');
  const playIcon = document.getElementById('radio-play-icon');
  const progressBar = document.getElementById('radio-progress');
  const currentTimeEl = document.getElementById('radio-current-time');
  const durationEl = document.getElementById('radio-duration');
  const epTitle = document.getElementById('radio-current-title');
  const epHost = document.getElementById('radio-current-host');
  const epCover = document.getElementById('radio-current-cover');
  const epDesc = document.getElementById('radio-current-desc');
  const spotifyLinkBtn = document.getElementById('radio-spotify-link');
  const episodesList = document.getElementById('radio-episodes-list');

  const episodes = getRadioEpisodes();
  let currentEp = episodes[0];
  let isPlaying = false;

  // Render episode list
  if (episodesList && episodes.length) {
    episodesList.innerHTML = episodes.map(ep => `
      <div class="radio-ep-item" onclick="window.selectRadioEpisode('${ep.id}')" style="padding: 0.75rem; border: 1px solid #E2E0D8; background: #FFFFFF; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-weight: bold; font-size: 0.8rem; color: #111111;">${ep.title}</h4>
          <span style="font-family: var(--font-mono); font-size: 0.65rem; color: #6B7280;">${ep.show} • ${ep.duration}</span>
        </div>
        <span style="font-family: var(--font-mono); font-size: 0.65rem; color: #9CA3AF;">${ep.date}</span>
      </div>
    `).join('');
  }

  window.selectRadioEpisode = (epId) => {
    const found = episodes.find(e => e.id === epId);
    if (found) {
      currentEp = found;
      if (epTitle) epTitle.textContent = found.title;
      if (epHost) epHost.textContent = `Bureau Host: ${found.host} • ${found.date}`;
      if (epCover) epCover.src = found.coverImage;
      if (epDesc) epDesc.textContent = found.description;
      if (spotifyLinkBtn) spotifyLinkBtn.href = found.spotifyUrl;
      if (audio) {
        audio.src = found.audioUrl;
        audio.play();
        isPlaying = true;
        if (playIcon) playIcon.textContent = '❚❚';
      }
    }
  };

  if (playBtn && audio) {
    playBtn.onclick = () => {
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
        if (playIcon) playIcon.textContent = '▶';
      } else {
        audio.play().catch(() => {});
        isPlaying = true;
        if (playIcon) playIcon.textContent = '❚❚';
      }
    };

    audio.ontimeupdate = () => {
      if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
      if (durationEl && audio.duration) durationEl.textContent = formatTime(audio.duration);
      if (progressBar && audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
      }
    };
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// 5. Campus Voice Poll & Name-Verified Voting (Multiple Surveys & Voter Dropdown)
let currentPollIndex = 0;

function initCampusVoiceSection() {
  const polls = getPolls();
  const allVoters = getSurveyVoters();
  const settings = getSettings();

  const currentPoll = polls[currentPollIndex] || polls[0];
  if (!currentPoll) return;

  const pollQuestion = document.getElementById('poll-question');
  const pollEdition = document.getElementById('poll-edition');
  const pollNavIndicator = document.getElementById('poll-nav-indicator');
  const pollOptionsContainer = document.getElementById('poll-options-container');

  // Voter Dropdown elements
  const voterDropdown = document.getElementById('survey-voter-dropdown');
  const voterDisplay = document.getElementById('selected-voter-choice-display');
  const voterBadge = document.getElementById('voter-count-badge');

  if (pollQuestion) pollQuestion.textContent = `"${currentPoll.question}"`;
  if (pollEdition) pollEdition.textContent = `Active Survey • ${currentPoll.edition}`;
  if (pollNavIndicator) {
    pollNavIndicator.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-family: var(--font-mono); font-size: 0.7rem;">
        <span>Question ${currentPollIndex + 1} of ${polls.length}</span>
        ${polls.length > 1 ? `
          <div style="display: flex; gap: 0.25rem;">
            <button class="btn-white" style="padding: 0.2rem 0.5rem; font-size: 0.65rem;" onclick="window.prevPollQuestion()" ${currentPollIndex === 0 ? 'disabled' : ''}>◀</button>
            <button class="btn-white" style="padding: 0.2rem 0.5rem; font-size: 0.65rem;" onclick="window.nextPollQuestion()" ${currentPollIndex === polls.length - 1 ? 'disabled' : ''}>▶</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Filter voters for this poll
  const pollVoters = allVoters.filter(v => v.pollId === currentPoll.id);
  if (voterBadge) voterBadge.textContent = `${pollVoters.length} Verified Votes`;

  if (voterDropdown) {
    if (!pollVoters.length) {
      voterDropdown.innerHTML = `<option value="">No student votes logged yet for this question</option>`;
      if (voterDisplay) voterDisplay.textContent = 'Be the first student to cast a verified vote!';
    } else {
      voterDropdown.innerHTML = `
        <option value="">-- Choose a student voter (${pollVoters.length}) --</option>
        ${pollVoters.map((v, idx) => `
          <option value="${idx}">
            ${v.voterName} — [${new Date(v.date).toLocaleDateString()}]
          </option>
        `).join('')}
      `;

      voterDropdown.onchange = (e) => {
        const selectedIdx = e.target.value;
        if (selectedIdx === '' || !pollVoters[selectedIdx]) {
          voterDisplay.textContent = 'Select a student above to inspect their chosen stance.';
        } else {
          const v = pollVoters[selectedIdx];
          voterDisplay.innerHTML = `
            <div>
              <span style="color: #7A132B; font-weight: bold;">Verified Voter:</span> <strong>${v.voterName}</strong>
            </div>
            <div style="margin-top: 0.35rem;">
              <span style="color: #6B7280; font-weight: bold;">Selected Option:</span> 
              <span style="color: #111111; font-weight: bold;">"${v.optionText}"</span>
            </div>
            <div style="margin-top: 0.25rem; font-size: 0.7rem; color: #9CA3AF;">
              Timestamp: ${new Date(v.date).toLocaleString()}
            </div>
          `;
        }
      };
    }
  }

  // Check if current user has verified & voted
  const votedChoice = localStorage.getItem(`uos_voted_${currentPoll.id}`);
  const hasVoted = Boolean(votedChoice);

  if (pollOptionsContainer) {
    if (!settings.campusVoiceEnabled) {
      pollOptionsContainer.innerHTML = `<div style="padding: 1rem; background: #FAF9F5; border: 1px solid #D1CFCA; text-align: center; font-family: var(--font-mono); font-size: 0.75rem;">${settings.campusVoicePausedMessage}</div>`;
    } else {
      let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
      
      currentPoll.options.forEach(opt => {
        const pct = currentPoll.totalVotes > 0 ? Math.round((opt.votes / currentPoll.totalVotes) * 100) : 0;
        const isSelected = votedChoice === opt.id;

        html += `
          <div class="poll-option-row" style="position: relative; width: 100%; border: 1px solid ${isSelected ? '#7A132B' : '#E2E0D8'}; background: #FAF9F6; padding: 0.85rem; overflow: hidden;">
            ${hasVoted ? `<div style="position: absolute; top: 0; bottom: 0; left: 0; width: ${pct}%; background: rgba(122, 19, 43, 0.12);"></div>` : ''}
            
            <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center;">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; width: 100%;">
                <input type="radio" name="poll_option" value="${opt.id}" data-text="${opt.text.replace(/"/g, '&quot;')}" ${isSelected ? 'checked' : ''} ${hasVoted ? 'disabled' : ''} style="accent-color: #7A132B;" />
                <span style="font-weight: 600; font-size: 0.85rem; color: #111111;">${opt.text}</span>
              </label>
              ${hasVoted ? `<span style="font-family: var(--font-mono); font-weight: bold; color: #7A132B; font-size: 0.8rem; margin-left: 0.5rem;">${pct}% (${opt.votes})</span>` : ''}
            </div>
          </div>
        `;
      });

      html += '</div>';

      // Name verification box if not voted yet
      if (!hasVoted) {
        html += `
          <div style="margin-top: 1rem; padding: 1rem; background: #FAF9F5; border: 1px solid #D1CFCA; font-family: var(--font-mono); font-size: 0.75rem;">
            <span style="font-weight: bold; color: #7A132B; display: block; margin-bottom: 0.5rem;">
              Step 2: Enter your name to verify and unlock live survey results
            </span>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <input id="voter-name" type="text" required placeholder="Your full name (Required) *" class="form-input" />
              <button onclick="window.submitVerifiedVote()" class="btn-maroon" style="justify-content: center; padding: 0.65rem;">
                Submit Verified Vote & View Results ↗
              </button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div style="margin-top: 0.75rem; padding: 0.75rem 1rem; background: #ECFDF5; border: 1px solid #A7F3D0; font-family: var(--font-mono); font-size: 0.75rem; color: #065F46; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span>✓ Your verified vote has been counted and added to the public voter dropdown!</span>
            <button onclick="window.resetMyVote()" class="btn-white" style="font-size: 0.65rem; padding: 0.25rem 0.6rem; color: #111111; cursor: pointer;">
              ↺ Change Vote / Vote Again
            </button>
          </div>
        `;
      }

      pollOptionsContainer.innerHTML = html;
    }
  }

  window.resetMyVote = () => {
    if (currentPoll) {
      localStorage.removeItem(`uos_voted_${currentPoll.id}`);
      localStorage.removeItem(`uos_voter_name_${currentPoll.id}`);
      initCampusVoiceSection();
    }
  };

  window.prevPollQuestion = () => {
    if (currentPollIndex > 0) {
      currentPollIndex -= 1;
      initCampusVoiceSection();
    }
  };

  window.nextPollQuestion = () => {
    if (currentPollIndex < polls.length - 1) {
      currentPollIndex += 1;
      initCampusVoiceSection();
    }
  };

  window.submitVerifiedVote = () => {
    const selected = document.querySelector('input[name="poll_option"]:checked');
    const nameInput = document.getElementById('voter-name');

    if (!selected) {
      alert('Please select an option first!');
      return;
    }
    if (!nameInput || !nameInput.value.trim()) {
      alert('Please enter your name to verify your vote and unlock results.');
      return;
    }

    const optId = selected.value;
    const optText = selected.dataset.text || 'Selected Option';
    const voterName = nameInput.value.trim();

    localStorage.setItem(`uos_voted_${currentPoll.id}`, optId);
    localStorage.setItem(`uos_voter_name_${currentPoll.id}`, voterName);

    // Save to Voter Log
    addSurveyVoter(currentPoll.id, voterName, optId, optText);

    // Increment vote count accurately as integer
    currentPoll.options = currentPoll.options.map(o => {
      const v = Number(o.votes) || 0;
      return o.id === optId ? { ...o, votes: v + 1 } : { ...o, votes: v };
    });

    // Calculate total answers dynamically from sum of all options
    currentPoll.totalVotes = currentPoll.options.reduce((sum, o) => sum + o.votes, 0);

    polls[currentPollIndex] = currentPoll;
    savePolls(polls);
    initCampusVoiceSection();
  };
}

// 6. Editorial Board Team
function renderTeamSection() {
  const container = document.getElementById('team-grid');
  if (container) {
    container.innerHTML = initialTeamMembers.map(m => `
      <div style="background-color: #FAF9F5; border: 1px solid #E2E0D8; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
            <img src="${m.avatar}" alt="${m.name}" style="width: 4rem; height: 4rem; object-fit: cover; border: 1px solid #111111;" />
            <div>
              <h3 style="font-weight: bold; font-size: 1rem; color: #111111;">${m.name}</h3>
              <p style="font-family: var(--font-mono); font-size: 0.75rem; color: #7A132B; font-weight: bold;">${m.role}</p>
              <p style="font-family: var(--font-mono); font-size: 0.65rem; color: #6B7280;">${m.department}</p>
            </div>
          </div>
          <p style="font-size: 0.75rem; color: #4B5563; line-height: 1.5;">${m.bio}</p>
        </div>

        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #E2E0D8; display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.7rem;">
          <a href="https://instagram.com/uosdigest" target="_blank" style="color: var(--uos-maroon); text-decoration: none; font-weight: bold;">@uosdigest</a>
          <span style="color: #9CA3AF;">UOS PRESS</span>
        </div>
      </div>
    `).join('');
  }
}

// 7. Newsletter Form
function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  const settings = getSettings();
  const formContainer = document.getElementById('newsletter-form-container');

  if (!settings.newsletterEnabled && formContainer) {
    formContainer.innerHTML = `<div style="padding: 2rem; background: #FAF9F5; border: 1px solid #D1CFCA; text-align: center; font-family: var(--font-mono); font-size: 0.8rem;">${settings.newsletterPausedMessage}</div>`;
    return;
  }

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const firstName = document.getElementById('sub-first-name').value;
      const lastName = document.getElementById('sub-last-name').value;
      const email = document.getElementById('sub-email').value;

      const checkedInterests = Array.from(document.querySelectorAll('input[name="interest"]:checked')).map(el => el.value);

      if (!firstName || !email) return;

      addSubscriber({
        firstName,
        lastName,
        email,
        selectedInterests: checkedInterests
      });

      // Background relay to Google Form
      try {
        const fd = new FormData();
        fd.append('entry.1262395500', firstName);
        fd.append('entry.1117940628', lastName);
        fd.append('entry.471474575', email);
        checkedInterests.forEach(i => fd.append('entry.1028977688', i));
        fetch('https://docs.google.com/forms/d/e/1FAIpQLScVYXw-BWi1aQBz8pzUBpAKrzRDftEkSnnM4oKPLwl6zYOuqQ/formResponse', {
          method: 'POST',
          mode: 'no-cors',
          body: fd
        }).catch(() => {});
      } catch (err) {}

      form.innerHTML = `
        <div style="padding: 2rem; background: #FAF9F5; border: 2px solid #7A132B; text-align: center;">
          <h3 style="font-weight: 900; font-size: 1.5rem; color: #111111;">Subscription Confirmed!</h3>
          <p style="font-size: 0.8rem; color: #4B5563; margin-top: 0.5rem;">Welcome, <strong>${firstName}</strong>. You are now on the University of Sharjah Press list.</p>
        </div>
      `;
    };
  }
}

// 8. Modals (Join, Podcast)
function initModals() {
  const joinModal = document.getElementById('join-modal');
  const podcastModal = document.getElementById('podcast-modal');
  const joinForm = document.getElementById('join-form');
  const podcastForm = document.getElementById('podcast-form');

  window.openJoinModal = () => {
    if (joinModal) joinModal.classList.add('active');
  };
  window.closeJoinModal = () => {
    if (joinModal) joinModal.classList.remove('active');
  };

  window.openPodcastModal = () => {
    if (podcastModal) podcastModal.classList.add('active');
  };
  window.closePodcastModal = () => {
    if (podcastModal) podcastModal.classList.remove('active');
  };

  if (joinForm) {
    joinForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('join-name').value;
      const email = document.getElementById('join-email').value;
      const studentId = document.getElementById('join-id').value;
      const role = document.getElementById('join-role').value;
      const pitch = document.getElementById('join-pitch').value;

      addJoinSubmission({ name, email, studentId, role, pitch });
      alert('Application received! The editorial board will contact you shortly.');
      window.closeJoinModal();
    };
  }

  if (podcastForm) {
    podcastForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('pod-name').value;
      const email = document.getElementById('pod-email').value;
      const topic = document.getElementById('pod-topic').value;

      addPodcastSubmission({ name, email, topic });
      alert('Podcast proposal received! Studio manager will review your topic.');
      window.closePodcastModal();
    };
  }
}

// 9. URL Routing (?issue=id)
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const issueId = params.get('issue');
  if (issueId) {
    const pubs = getPublications();
    const found = pubs.find(p => p.id === issueId);
    if (found) openReader(found);
  }
}
