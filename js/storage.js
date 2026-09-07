/**
 * University of Sharjah - Storage & Database Engine (Pure Vanilla JS + Firebase Firestore Sync)
 */

import { initialPublications, initialPolls, initialSurveyVoters, initialRadioEpisodes, initialTimesArticles } from './data.js';
import { 
  db, 
  isFirebaseAvailable, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from './firebase.js';

const KEYS = {
  PUBLICATIONS: 'uos_digest_publications_v2',
  FEATURED_ID: 'uos_digest_featured_id_v2',
  SETTINGS: 'uos_digest_form_settings_v2',
  SUBSCRIBERS: 'uos_digest_newsletter_subs_v2',
  JOIN_SUBS: 'uos_digest_join_subs_v2',
  PODCAST_SUBS: 'uos_digest_podcast_subs_v2',
  POLLS: 'uos_digest_poll_data_v2',
  SURVEY_VOTERS: 'uos_digest_survey_voters_v2',
  RADIO_EPISODES: 'uos_digest_radio_episodes_v2',
  TIMES_ARTICLES: 'uos_times_articles_v1',
  AUTH: 'uos_digest_admin_auth'
};

export const defaultSettings = {
  newsletterEnabled: true,
  newsletterPausedMessage: 'The newsletter subscription portal is temporarily paused for the semester break. Please check back soon!',
  joinClubEnabled: true,
  joinClubPausedMessage: 'Press Club applications are currently closed for this recruitment cycle. Stay tuned for the next call for editors.',
  podcastApplyEnabled: true,
  podcastApplyPausedMessage: 'The Ittisal Radio recording booth is currently fully booked for this academic term.',
  campusVoiceEnabled: true,
  campusVoicePausedMessage: 'Voting is concluded for this edition of the campus pulse survey.',
};

// Asynchronous background write to Firebase Firestore
async function saveToFirestore(docName, payload) {
  if (!isFirebaseAvailable || !db) return;
  try {
    const docRef = doc(db, 'site_data', docName);
    await setDoc(docRef, { payload, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn(`Firestore sync error for ${docName}:`, err);
  }
}

// Live real-time synchronizer across all user sessions and devices
let syncInitialized = false;
export async function initLiveSync(onDataChange) {
  if (!isFirebaseAvailable || !db || syncInitialized) return;
  syncInitialized = true;

  const collectionsToSync = [
    { key: 'polls', localKey: KEYS.POLLS, defaultVal: initialPolls },
    { key: 'survey_voters', localKey: KEYS.SURVEY_VOTERS, defaultVal: initialSurveyVoters },
    { key: 'publications', localKey: KEYS.PUBLICATIONS, defaultVal: initialPublications },
    { key: 'featured_id', localKey: KEYS.FEATURED_ID, defaultVal: 'uos-digest-issue-3', isPrimitive: true },
    { key: 'radio_episodes', localKey: KEYS.RADIO_EPISODES, defaultVal: initialRadioEpisodes },
    { key: 'settings', localKey: KEYS.SETTINGS, defaultVal: defaultSettings },
    { key: 'subscribers', localKey: KEYS.SUBSCRIBERS, defaultVal: [] },
    { key: 'join_submissions', localKey: KEYS.JOIN_SUBS, defaultVal: [] },
    { key: 'podcast_submissions', localKey: KEYS.PODCAST_SUBS, defaultVal: [] },
    { key: 'times_articles', localKey: KEYS.TIMES_ARTICLES, defaultVal: initialTimesArticles }
  ];

  for (const { key, localKey, defaultVal, isPrimitive } of collectionsToSync) {
    try {
      const docRef = doc(db, 'site_data', key);
      
      // 1. Initial cloud fetch or seeding
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        let valToSave;
        if (isPrimitive) {
          valToSave = localStorage.getItem(localKey) || defaultVal;
        } else {
          try {
            const raw = localStorage.getItem(localKey);
            valToSave = raw ? JSON.parse(raw) : defaultVal;
          } catch (e) {
            valToSave = defaultVal;
          }
        }
        await saveToFirestore(key, valToSave);
      } else {
        let cloudData = snap.data()?.payload;
        if (cloudData !== undefined) {
          if (key === 'publications' && Array.isArray(cloudData)) {
            let changed = false;
            cloudData.forEach(p => {
              const def = initialPublications.find(d => d.id === p.id);
              if (def && p.description && (p.description.includes('intellectual, artistic') || p.description.includes('student lab magazine'))) {
                p.description = def.description;
                p.highlights = def.highlights;
                changed = true;
              }
            });
            if (changed) {
              saveToFirestore('publications', cloudData);
            }
          }
          if (isPrimitive) {
            localStorage.setItem(localKey, String(cloudData));
          } else {
            localStorage.setItem(localKey, JSON.stringify(cloudData));
          }
          if (typeof onDataChange === 'function') {
            onDataChange(key);
          }
        }
      }

      // 2. Attach live real-time listener
      onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          let cloudData = docSnap.data()?.payload;
          if (cloudData !== undefined) {
            if (key === 'publications' && Array.isArray(cloudData)) {
              cloudData.forEach(p => {
                const def = initialPublications.find(d => d.id === p.id);
                if (def && p.description && (p.description.includes('intellectual, artistic') || p.description.includes('student lab magazine'))) {
                  p.description = def.description;
                  p.highlights = def.highlights;
                }
              });
            }
            if (isPrimitive) {
              localStorage.setItem(localKey, String(cloudData));
            } else {
              localStorage.setItem(localKey, JSON.stringify(cloudData));
            }
            if (typeof onDataChange === 'function') {
              onDataChange(key);
            }
          }
        }
      }, (err) => {
        console.warn(`Realtime listener notice for ${key}:`, err);
      });
    } catch (e) {
      console.warn(`Firestore sync notice for ${key}:`, e);
    }
  }
}

// 1. Publications Management (Add, Edit, Delete, Pin)
export function getPublications() {
  try {
    const data = localStorage.getItem(KEYS.PUBLICATIONS);
    if (data) {
      const stored = JSON.parse(data);
      if (Array.isArray(stored) && stored.length) {
        let needsResave = false;
        const merged = stored.map(storedPub => {
          const defaults = initialPublications.find(p => p.id === storedPub.id) || {};
          if (storedPub.description && (storedPub.description.includes('intellectual, artistic') || storedPub.description.includes('student lab magazine'))) {
            storedPub.description = defaults.description;
            storedPub.highlights = defaults.highlights;
            needsResave = true;
          }
          return { ...defaults, ...storedPub };
        });
        if (needsResave) {
          savePublications(merged);
        }
        return merged;
      }
    }
  } catch (e) {}
  return initialPublications;
}

export function savePublications(pubs) {
  localStorage.setItem(KEYS.PUBLICATIONS, JSON.stringify(pubs));
  saveToFirestore('publications', pubs);
}

export function addPublication(pub) {
  const pubs = getPublications();
  pubs.unshift(pub);
  savePublications(pubs);
  return pubs;
}

export function updatePublication(updatedPub) {
  const pubs = getPublications();
  const index = pubs.findIndex(p => p.id === updatedPub.id);
  if (index !== -1) {
    pubs[index] = { ...pubs[index], ...updatedPub };
    savePublications(pubs);
  }
  return pubs;
}

export function deletePublication(id) {
  const pubs = getPublications().filter(p => p.id !== id);
  savePublications(pubs);
  return pubs;
}

export function getFeaturedId() {
  return localStorage.getItem(KEYS.FEATURED_ID) || 'uos-digest-issue-3';
}

export function setFeaturedId(id) {
  localStorage.setItem(KEYS.FEATURED_ID, id);
  saveToFirestore('featured_id', id);
}

// 2. Settings
export function getSettings() {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return defaultSettings;
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  saveToFirestore('settings', settings);
}

// 3. Newsletter Subscribers (Add, Edit, Delete)
export function getSubscribers() {
  try {
    const data = localStorage.getItem(KEYS.SUBSCRIBERS);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [
    {
      id: 'sub-101',
      firstName: 'Fatima',
      lastName: 'Al-Mansouri',
      email: 'u22104819@sharjah.ac.ae',
      selectedInterests: ['Art', 'Culture', 'Photography', 'News'],
      date: '2026-02-28T10:14:00.000Z'
    },
    {
      id: 'sub-102',
      firstName: 'Rashid',
      lastName: 'Al-Zarooni',
      email: 'u21109342@sharjah.ac.ae',
      selectedInterests: ['News', 'Trends'],
      date: '2026-02-27T16:20:00.000Z'
    },
    {
      id: 'sub-103',
      firstName: 'Mariam',
      lastName: 'Kareem',
      email: 'u23101156@sharjah.ac.ae',
      selectedInterests: ['Art', 'Photography', 'Trends'],
      date: '2026-02-26T09:45:00.000Z'
    }
  ];
}

export function addSubscriber(sub) {
  const list = getSubscribers();
  const newSub = {
    ...sub,
    id: 'sub-' + Date.now(),
    date: new Date().toISOString()
  };
  list.unshift(newSub);
  localStorage.setItem(KEYS.SUBSCRIBERS, JSON.stringify(list));
  saveToFirestore('subscribers', list);
  return newSub;
}

export function updateSubscriber(updatedSub) {
  const list = getSubscribers();
  const updated = list.map(item => item.id === updatedSub.id ? { ...item, ...updatedSub } : item);
  localStorage.setItem(KEYS.SUBSCRIBERS, JSON.stringify(updated));
  saveToFirestore('subscribers', updated);
  return updated;
}

export function deleteSubscriber(id) {
  const list = getSubscribers().filter(item => item.id !== id);
  localStorage.setItem(KEYS.SUBSCRIBERS, JSON.stringify(list));
  saveToFirestore('subscribers', list);
  return list;
}

// 4. Student Applications (Add, Edit, Change Status)
export function getJoinSubmissions() {
  try {
    const data = localStorage.getItem(KEYS.JOIN_SUBS);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [
    {
      id: 'join-01',
      name: 'Abdullah Al-Nuaimi',
      email: 'u22105930@sharjah.ac.ae',
      studentId: 'U22105930 / Mass Comm',
      role: 'Journalist / Writer',
      pitch: 'Investigative piece on student startups across UAE incubators and youth hubs.',
      status: 'approved', // 'approved' | 'declined' | 'waitlist' | 'pending'
      date: '2026-02-27T14:30:00.000Z'
    }
  ];
}

export function addJoinSubmission(app) {
  const list = getJoinSubmissions();
  const newApp = {
    ...app,
    id: 'join-' + Date.now(),
    status: 'pending',
    date: new Date().toISOString()
  };
  list.unshift(newApp);
  localStorage.setItem(KEYS.JOIN_SUBS, JSON.stringify(list));
  saveToFirestore('join_submissions', list);
  return newApp;
}

export function updateJoinSubmission(updated) {
  const list = getJoinSubmissions();
  const res = list.map(item => item.id === updated.id ? { ...item, ...updated } : item);
  localStorage.setItem(KEYS.JOIN_SUBS, JSON.stringify(res));
  saveToFirestore('join_submissions', res);
  return res;
}

export function updateJoinStatus(id, status) {
  const list = getJoinSubmissions();
  const updated = list.map(item => item.id === id ? { ...item, status } : item);
  localStorage.setItem(KEYS.JOIN_SUBS, JSON.stringify(updated));
  saveToFirestore('join_submissions', updated);
  return updated;
}

export function deleteJoinSubmission(id) {
  const list = getJoinSubmissions().filter(item => item.id !== id);
  localStorage.setItem(KEYS.JOIN_SUBS, JSON.stringify(list));
  saveToFirestore('join_submissions', list);
  return list;
}

// 5. Radio Podcast Applications (Add, Edit, Change Status)
export function getPodcastSubmissions() {
  try {
    const data = localStorage.getItem(KEYS.PODCAST_SUBS);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [
    {
      id: 'pod-01',
      name: 'Sultan Bin Humaid',
      email: 'u21104882@sharjah.ac.ae',
      studentId: 'U21104882 / Audio Production',
      topic: 'The Evolution of Arabic Journalism Podcasts in the Gulf.',
      guestNames: 'Dr. Hiba (Faculty), Student Union Media Secretary',
      preferredDate: '2026-03-10',
      status: 'scheduled', // 'scheduled' | 'declined' | 'postponed' | 'pending'
      date: '2026-02-26T12:00:00.000Z'
    }
  ];
}

export function addPodcastSubmission(pitch) {
  const list = getPodcastSubmissions();
  const newPitch = {
    ...pitch,
    id: 'pod-' + Date.now(),
    status: 'pending',
    date: new Date().toISOString()
  };
  list.unshift(newPitch);
  localStorage.setItem(KEYS.PODCAST_SUBS, JSON.stringify(list));
  saveToFirestore('podcast_submissions', list);
  return newPitch;
}

export function updatePodcastSubmission(updated) {
  const list = getPodcastSubmissions();
  const res = list.map(item => item.id === updated.id ? { ...item, ...updated } : item);
  localStorage.setItem(KEYS.PODCAST_SUBS, JSON.stringify(res));
  saveToFirestore('podcast_submissions', res);
  return res;
}

export function updatePodcastStatus(id, status) {
  const list = getPodcastSubmissions();
  const updated = list.map(item => item.id === id ? { ...item, status } : item);
  localStorage.setItem(KEYS.PODCAST_SUBS, JSON.stringify(updated));
  saveToFirestore('podcast_submissions', updated);
  return updated;
}

export function deletePodcastSubmission(id) {
  const list = getPodcastSubmissions().filter(item => item.id !== id);
  localStorage.setItem(KEYS.PODCAST_SUBS, JSON.stringify(list));
  saveToFirestore('podcast_submissions', list);
  return list;
}

// 6. Multi-Poll Management & Real Voter Records
export function getPolls() {
  try {
    const data = localStorage.getItem(KEYS.POLLS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) {}
  // Deep clone to prevent in-memory mutation of the original initialPolls array
  return JSON.parse(JSON.stringify(initialPolls));
}

export function savePolls(polls) {
  localStorage.setItem(KEYS.POLLS, JSON.stringify(polls));
  saveToFirestore('polls', polls);
}

export function addPollQuestion(poll) {
  const polls = getPolls();
  const newPoll = {
    ...poll,
    id: 'poll-' + Date.now(),
    totalVotes: poll.options.reduce((acc, o) => acc + (o.votes || 0), 0)
  };
  polls.unshift(newPoll);
  savePolls(polls);
  return polls;
}

export function updatePollQuestion(updatedPoll) {
  const polls = getPolls();
  const index = polls.findIndex(p => p.id === updatedPoll.id);
  if (index !== -1) {
    polls[index] = { ...polls[index], ...updatedPoll };
    savePolls(polls);
  }
  return polls;
}

export function deletePollQuestion(pollId) {
  const polls = getPolls().filter(p => p.id !== pollId);
  savePolls(polls);
  return polls;
}

// 7. Survey Voter Log Entries
export function getSurveyVoters() {
  try {
    const data = localStorage.getItem(KEYS.SURVEY_VOTERS);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return JSON.parse(JSON.stringify(initialSurveyVoters));
}

export function addSurveyVoter(pollId, voterName, optionId, optionText) {
  const voters = getSurveyVoters();
  const newVoter = {
    pollId,
    voterName,
    optionId,
    optionText,
    date: new Date().toISOString()
  };
  voters.unshift(newVoter);
  localStorage.setItem(KEYS.SURVEY_VOTERS, JSON.stringify(voters));
  saveToFirestore('survey_voters', voters);
  return voters;
}

// 8. Ittisal Radio Episodes (Dynamic Cloud Sync)
export function getRadioEpisodes() {
  try {
    const data = localStorage.getItem(KEYS.RADIO_EPISODES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(initialRadioEpisodes));
}

export function saveRadioEpisodes(episodes) {
  localStorage.setItem(KEYS.RADIO_EPISODES, JSON.stringify(episodes));
  saveToFirestore('radio_episodes', episodes);
}

// 9. Export CSV Helper
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            if (Array.isArray(cell)) cell = cell.join('; ');
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 10. The UOS Times Newspaper Articles Engine (Local + Firebase Sync)
export function getTimesArticles() {
  const raw = localStorage.getItem(KEYS.TIMES_ARTICLES);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) {}
  }
  return JSON.parse(JSON.stringify(initialTimesArticles));
}

export function saveTimesArticles(articles) {
  localStorage.setItem(KEYS.TIMES_ARTICLES, JSON.stringify(articles));
  saveToFirestore('times_articles', articles);
}

export function addTimesArticle(article) {
  const articles = getTimesArticles();
  const newArticle = {
    id: `uos-times-${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    featured: false,
    ...article
  };
  articles.unshift(newArticle);
  saveTimesArticles(articles);
  return newArticle;
}

export function updateTimesArticle(updated) {
  const articles = getTimesArticles();
  const index = articles.findIndex(a => a.id === updated.id);
  if (index !== -1) {
    articles[index] = { ...articles[index], ...updated };
    saveTimesArticles(articles);
    return articles[index];
  }
  return null;
}

export function deleteTimesArticle(id) {
  const articles = getTimesArticles();
  const filtered = articles.filter(a => a.id !== id);
  saveTimesArticles(filtered);
  return filtered;
}

export function toggleTimesArticleFeatured(id) {
  const articles = getTimesArticles();
  const found = articles.find(a => a.id === id);
  if (found) {
    found.featured = !found.featured;
    saveTimesArticles(articles);
  }
  return articles;
}

