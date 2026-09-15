# Graph Report - UOS_Digest  (2026-09-15)

## Corpus Check
- Large corpus: 37 files · ~556,398 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 122 nodes · 232 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 34,428 input · 1,290 output

## Community Hubs (Navigation)
- Main Reader & Campus Voice
- Instagram Scraper & Sync Automation
- Admin Dashboard & Forms Management
- Data Storage & CSV Export
- UOS Times Reader & News Search
- Polls, Surveys & Voting System
- Site Settings & Live Sync Configuration
- Podcast Submissions & Radio Episodes
- UOS Times Article Management
- Editorial Portals & Publication Identity
- Join Team Application Workflow
- Issue Publications & PDF Metadata
- GitHub Actions Instagram Sync CI
- UOS Digest Issue 3 Print Publication
- The UOS Times Issue 2 Print Edition

## God Nodes (most connected - your core abstractions)
1. `saveToFirestore()` - 21 edges
2. `normalizeOptionList()` - 7 edges
3. `savePolls()` - 7 edges
4. `savePublications()` - 6 edges
5. `getSettings()` - 6 edges
6. `getPolls()` - 6 edges
7. `saveTimesArticles()` - 6 edges
8. `refresh_metrics_for_posts()` - 6 edges
9. `main()` - 6 edges
10. `renderTabContent()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Admin Portal` --references--> `UOS Digest Home`  [EXTRACTED]
  admin.html → index.html
- `The UOS Times` --references--> `Admin Portal`  [EXTRACTED]
  times.html → admin.html
- `UOS Digest Home` --references--> `The UOS Times`  [EXTRACTED]
  index.html → times.html
- `initPubFormHandler()` --calls--> `uploadImageToStorage()`  [EXTRACTED]
  js/admin.js → js/firebase.js
- `initPubFormHandler()` --calls--> `uploadPdfToStorage()`  [EXTRACTED]
  js/admin.js → js/firebase.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **UOS Student Media Ecosystem** — admin_html, index_html, times_html, press_club_editorial_board [EXTRACTED 1.00]

## Communities (15 total, 3 thin omitted)

### Community 0 - "Main Reader & Campus Voice"
Cohesion: 0.12
Nodes (18): checkUrlParams(), formatTime(), initCampusVoiceSection(), initModals(), initNewsletterForm(), initRadioSection(), openReader(), renderHeroAndPublications() (+10 more)

### Community 1 - "Instagram Scraper & Sync Automation"
Cohesion: 0.20
Nodes (16): fetch_metrics_from_embed(), fetch_metrics_from_web(), fetch_posts_via_instaloader(), fetch_posts_via_playwright(), load_existing_posts(), main(), merge_and_slide_window(), parse_count() (+8 more)

### Community 2 - "Admin Dashboard & Forms Management"
Cohesion: 0.36
Nodes (9): initAdminDashboard(), initPubFormHandler(), initSubEditFormHandler(), initTimesFormHandler(), renderAdminView(), renderTabContent(), firebaseConfig, uploadImageToStorage() (+1 more)

### Community 3 - "Data Storage & CSV Export"
Cohesion: 0.24
Nodes (7): addSubscriber(), defaultSettings, deleteSubscriber(), getSubscribers(), KEYS, setFeaturedId(), updateSubscriber()

### Community 4 - "UOS Times Reader & News Search"
Cohesion: 0.38
Nodes (9): articles, initSearchHandler(), initTimesPage(), initTipForm(), populateTipCategories(), renderAll(), renderArticlesGrid(), renderFrontLead() (+1 more)

### Community 5 - "Polls, Surveys & Voting System"
Cohesion: 0.33
Nodes (9): addPollQuestion(), addSurveyVoter(), deletePollQuestion(), deleteSingleSurveyVote(), getPolls(), getSurveyVoters(), savePolls(), togglePollQuestionHidden() (+1 more)

### Community 6 - "Site Settings & Live Sync Configuration"
Cohesion: 0.43
Nodes (8): getApplicationRoles(), getSettings(), getTipCategories(), initLiveSync(), normalizeOptionList(), saveApplicationRoles(), saveSettings(), saveTipCategories()

### Community 7 - "Podcast Submissions & Radio Episodes"
Cohesion: 0.43
Nodes (7): addPodcastSubmission(), deletePodcastSubmission(), getPodcastSubmissions(), saveRadioEpisodes(), saveToFirestore(), updatePodcastStatus(), updatePodcastSubmission()

### Community 8 - "UOS Times Article Management"
Cohesion: 0.53
Nodes (6): addTimesArticle(), deleteTimesArticle(), getTimesArticles(), saveTimesArticles(), toggleTimesArticleFeatured(), updateTimesArticle()

### Community 9 - "Editorial Portals & Publication Identity"
Cohesion: 0.50
Nodes (5): Admin Portal, UOS Digest Home, Ittisal Radio, Press Club Editorial Board, The UOS Times

### Community 10 - "Join Team Application Workflow"
Cohesion: 0.40
Nodes (5): addJoinSubmission(), deleteJoinSubmission(), getJoinSubmissions(), updateJoinStatus(), updateJoinSubmission()

### Community 11 - "Issue Publications & PDF Metadata"
Cohesion: 0.70
Nodes (5): addPublication(), deletePublication(), getPublications(), savePublications(), updatePublication()

## Knowledge Gaps
- **9 isolated node(s):** `firebaseConfig`, `KEYS`, `defaultSettings`, `articles`, `Instagram Sync Workflow` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 23 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `saveToFirestore()` connect `Podcast Submissions & Radio Episodes` to `Data Storage & CSV Export`, `Polls, Surveys & Voting System`, `Site Settings & Live Sync Configuration`, `UOS Times Article Management`, `Join Team Application Workflow`, `Issue Publications & PDF Metadata`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `firebaseConfig`, `KEYS`, `defaultSettings` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Main Reader & Campus Voice` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._