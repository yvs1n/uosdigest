/**
 * University of Sharjah - The Press Club & UOS Digest Data Module
 */

export const initialPublications = [
  {
    id: "uos-digest-issue-3",
    title: "UOS Digest, Issue #3",
    subtitle: "Constructed: The Construction of Self, Identity and Culture",
    issueNumber: 3,
    type: "magazine",
    publicationName: "UOS Digest",
    theme: "Constructed Identity & Pop Culture",
    semester: "Spring Semester",
    academicYear: "2025–2026",
    releaseDate: "February 2026",
    coverImage: "/assets/covers/uos-digest-issue-3.png",
    pdfFileUrl: "/pdf/uos digest issue 3 for print.pdf",
    featured: true,
    pageCount: 36,
    description: "The student magazine of the University of Sharjah. Written, photographed, and designed by students at the College of Communication.",
    highlights: [
      "Photo essays & visual portfolios from student photographers",
      "Essays on campus culture, creative pressure, and student life",
      "Long-form reporting and faculty conversations"
    ],
    tags: ["Constructed", "Identity", "Visual Culture", "Student Life"]
  },
  {
    id: "uos-digest-issue-2",
    title: "UOS Digest, Issue #2",
    subtitle: "Press Culture: The Politics of Pop Culture",
    issueNumber: 2,
    type: "magazine",
    publicationName: "UOS Digest",
    theme: "Press Culture",
    semester: "Fall Semester",
    academicYear: "2025–2026",
    releaseDate: "October 2025",
    coverImage: "/assets/covers/uos-digest-issue-2.png",
    pdfFileUrl: "/pdf/UOS Digest issue #2, Print.pdf",
    featured: false,
    pageCount: 40,
    description: "An inquiry into modern newsrooms, pop cultural phenomena, social media narratives, and student-produced critical essays.",
    highlights: [
      "The Evolution of Arabic Print Media in Sharjah",
      "Photo essay: 24 Hours in the College of Communication Studio",
      "Interviews with leading UAE alumni in broadcast television"
    ],
    tags: ["Press Culture", "Pop Culture", "Essays", "Broadcasting"]
  },
  {
    id: "uos-digest-issue-1",
    title: "UOS Digest, Issue #1",
    subtitle: "Culture, Photography & University Life",
    issueNumber: 1,
    type: "magazine",
    publicationName: "UOS Digest",
    theme: "Foundation Edition",
    semester: "Spring Semester",
    academicYear: "2024–2025",
    releaseDate: "February 2025",
    coverImage: "/assets/covers/uos-digest-issue-1.png",
    pdfFileUrl: "/pdf/UOS DIGEST.pdf",
    featured: false,
    pageCount: 28,
    description: "The premiere release of UOS Digest featuring visual photography folios, creative writing, and student profiles.",
    highlights: [
      "Student photography gallery: Sharjah light and shadow",
      "Faculty editorial: The future of university communications",
      "Campus poetry & short essays in Arabic and English"
    ],
    tags: ["First Edition", "Photography", "Creative Writing", "Art"]
  }
];

export const initialTimesBroadsheets = [
  {
    id: "uos-times-issue-2",
    title: "The UOS Times, Issue #2",
    subtitle: "Campus Broadsheet & University Affairs",
    issueNumber: 2,
    type: "newspaper",
    publicationName: "The UOS Times",
    academicYear: "Academic Year 2025–2026",
    releaseDate: "November 2025",
    coverImage: "/assets/covers/uos-times-issue-2.png",
    pdfFileUrl: "/pdf/The UOS Times final for print.pdf",
    pageCount: 16,
    description: "Campus Broadsheet & University Affairs — Coverage of Media Week, student investigative essays, and campus elections."
  },
  {
    id: "uos-times-issue-1",
    title: "The UOS Times, Issue #1",
    subtitle: "Inaugural Student Broadsheet Edition",
    issueNumber: 1,
    type: "newspaper",
    publicationName: "The UOS Times",
    academicYear: "Academic Year 2024–2025",
    releaseDate: "April 2025",
    coverImage: "/assets/covers/uos-times-issue-1.png",
    pdfFileUrl: "/pdf/uos times issue 17 print.pdf",
    pageCount: 12,
    description: "Inaugural Student Broadsheet Edition — The launch issue introducing student beat reporting and youth journalism in Sharjah."
  }
];

export const initialRadioEpisodes = [
  {
    id: "ittisal-radio-ep-8",
    title: "Ep. 08: Beyond the Byline — Student Journalism in the Digital Era",
    show: "Ittisal Radio (اتصال)",
    episodeNumber: 8,
    duration: "24:18",
    host: "Press Club Media Team",
    description: "Student editors talk about keeping a print magazine alive in the scroll era, chasing sources across campus, and what student news looks like today.",
    date: "February 2026",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverImage: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
    spotifyUrl: "https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk"
  },
  {
    id: "ittisal-radio-ep-7",
    title: "Ep. 07: The Weekly Fix — Campus Culture, Midterms & Controversial Takes",
    show: "The Weekly Fix",
    episodeNumber: 7,
    duration: "18:45",
    host: "Samreen & Press Team",
    description: "A quick rundown of club activities, upcoming issues of The UOS Times, and a recap of the university film festival.",
    date: "January 2026",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverImage: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80",
    spotifyUrl: "https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk"
  },
  {
    id: "ittisal-radio-ep-6",
    title: "Ep. 06: Designing a Magazine from Scratch with UOS Digest Editors",
    show: "Ittisal Radio (اتصال)",
    episodeNumber: 6,
    duration: "31:10",
    host: "Design & Editorial Leads",
    description: "How the design team crafts the visual layout for 'Constructed', selects fonts, and curates student art spreads.",
    date: "November 2025",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    spotifyUrl: "https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk"
  }
];

export const initialPolls = [
  {
    id: "controversial-take-01",
    question: "What is your take on print magazines vs digital scrolling for campus news?",
    edition: "Edition #3 Community Pulse",
    options: [
      { id: "opt-1", text: "Nothing beats holding a physical printed copy around campus", votes: 0 },
      { id: "opt-2", text: "Digital flipbook & mobile reader on the go is superior", votes: 1 },
      { id: "opt-3", text: "Both! Keep print for special issues & digital for the weekly fix", votes: 1 }
    ],
    totalVotes: 2
  },
  {
    id: "podcast-topic-02",
    question: "Which topic should the next Ittisal Radio studio panel tackle?",
    edition: "Edition #3 Broadcast Poll",
    options: [
      { id: "pod-opt-1", text: "AI in Media & Academic Journalism Ethics", votes: 0 },
      { id: "pod-opt-2", text: "Career Pathways in UAE Film & Television", votes: 0 },
      { id: "pod-opt-3", text: "Behind the Scenes of Campus Event Planning", votes: 0 }
    ],
    totalVotes: 0
  }
];

export const initialSurveyVoters = [];

export const initialInstagramPosts = [
  {
    "id": "Ddq3n-WsNCE",
    "shortcode": "Ddq3n-WsNCE",
    "permalink": "https://www.instagram.com/uosdigest/reel/Ddq3n-WsNCE/",
    "imageUrl": "assets/instagram/Ddq3n-WsNCE.jpg",
    "caption": "UOS DIGEST ISSUE 4 RELEASE EVENT: SEPTEMBER 30TH 12PM-4PM, c11 (w7) 

#uos #universityofsharjah #event #uni #uosdigest",
    "timestamp": "2026-09-24T12:19:17Z",
    "likes": 72,
    "comments": 7
  },
  {
    "id": "DdoeguOzb1J",
    "shortcode": "DdoeguOzb1J",
    "permalink": "https://www.instagram.com/uosdigest/reel/DdoeguOzb1J/",
    "imageUrl": "assets/instagram/DdoeguOzb1J.jpg",
    "caption": "CAMPUS COUTURE EPISODE 14: one word

#uos #universityofsharjah #student #campuslife #uni",
    "timestamp": "2026-09-23T14:01:21Z",
    "likes": 35,
    "comments": 0
  },
  {
    "id": "DdlI9dvMPqi",
    "shortcode": "DdlI9dvMPqi",
    "permalink": "https://www.instagram.com/uosdigest/p/DdlI9dvMPqi/",
    "imageUrl": "assets/instagram/DdlI9dvMPqi.jpg",
    "caption": "UOS DIGEST ISSUE #4 COMING TO UR FAV COLLEGE (communications) ON SEPTEMBER 30TH 12-PM-4PM 

SKIP THEM CLASSES, BOOK OUT UR AFTERNOON AND JOIN US FOR THE MOST EP...",
    "timestamp": "2026-09-22T06:55:19Z",
    "likes": 123,
    "comments": 16
  },
  {
    "id": "DdWYd47MuMQ",
    "shortcode": "DdWYd47MuMQ",
    "permalink": "https://www.instagram.com/uosdigest/reel/DdWYd47MuMQ/",
    "imageUrl": "assets/instagram/DdWYd47MuMQ.jpg",
    "caption": "CAMPUS COUTURE EPISODE 13: would you rather? #uos #universityofsharjah #wouldyourather #uni #student",
    "timestamp": "2026-09-16T13:22:13Z",
    "likes": 41,
    "comments": 2
  },
  {
    "id": "DdUC6ZfMdpT",
    "shortcode": "DdUC6ZfMdpT",
    "permalink": "https://www.instagram.com/uosdigest/reel/DdUC6ZfMdpT/",
    "imageUrl": "assets/instagram/DdUC6ZfMdpT.jpg",
    "caption": "tiny mic ft. @sasa_updates !!!!! 

#uos #sasa #tinymic #universityofsharjah",
    "timestamp": "2026-09-15T15:35:23Z",
    "likes": 177,
    "comments": 3
  },
  {
    "id": "DdQd1KvsaeI",
    "shortcode": "DdQd1KvsaeI",
    "permalink": "https://www.instagram.com/uosdigest/reel/DdQd1KvsaeI/",
    "imageUrl": "assets/instagram/DdQd1KvsaeI.jpg",
    "caption": "THE PHOTOGRAPHY SPREAD IS BACCKKKK 

SUBMIT 3-5 OF UR FAV PICTURES BY DMING US ON IG @UOSDIGEST BY SEPTEMBER 22ND 

#uosdigest #uni #photography #magazine",
    "timestamp": "2026-09-14T06:13:38Z",
    "likes": 68,
    "comments": 5
  }
];

export const initialTimesArticles = [
  {
    id: "uos-times-art-1",
    title: "University of Sharjah Unveils Sustainable Campus Initiative Ahead of 2026 Academic Summit",
    subtitle: "Zero-waste roadmap, solar canopy installations, and electric transport corridors position Sharjah as a regional pioneer in green collegiate infrastructure.",
    category: "Campus News",
    author: "Mariam Al-Hammadi",
    authorRole: "Senior News Editor",
    date: "September 4, 2026",
    readTime: "4 min read",
    featured: true,
    coverImage: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
    excerpt: "The University of Sharjah administration has unveiled an ambitious sustainability charter targeting campus-wide carbon neutrality by 2032, featuring smart solar canopies and zero-waste dining facilities.",
    content: `The University of Sharjah administration has officially unveiled its 2026–2032 Ecological Stewardship Charter, detailing an aggressive, multi-phase transformation across all college precincts and student residence complexes.

Speaking at the inauguration ceremony held in the College of Engineering auditorium, university officials presented detailed blueprints for 45,000 square meters of photovoltaic solar pergolas covering university car parks, an upgraded district cooling filtration plant, and a synchronized zero-landfill initiative in partnership with Sharjah environment authority Bee'ah.

"This is not merely an institutional facilities initiative; it is an educational pedagogical commitment," stated the Dean of Academic Affairs. "Our engineering, environmental sciences, and media students will directly monitor live sustainability telemetry from dashboards installed across campus plazas."

Phase one construction begins next month, with the central campus shuttle service transitioning to a 100% electrified autonomous fleet by the beginning of the Spring 2027 term.`,
    tags: ["Sustainability", "Campus Infrastructure", "Sharjah", "Academic Summit"]
  },
  {
    id: "uos-times-art-2",
    title: "College of Communication Inaugurates Advanced Digital Multimedia & Podcast Production Suite",
    subtitle: "New multi-camera broadcast studios, Dolby-calibrated recording booths, and digital editing terminals bolster student investigative journalism.",
    category: "Academics & Tech",
    author: "Zayd Al-Obeidli",
    authorRole: "Technology Reporter",
    date: "September 1, 2026",
    readTime: "3 min read",
    featured: false,
    coverImage: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Equipped with industry-grade audio suites and multi-camera live switching, the new M-10 production suite represents a major leap in student media training across the UAE.",
    content: `Student broadcasters and investigative journalists at the College of Communication gained access this week to the university's newly completed Media Production Complex on the first floor of the M-10 Building.

The multi-million-dirham facility houses two professional television studios with 4K robotic cameras, a dedicated audio suite designed specifically for Ittisal Radio podcasts, and a 30-seat digital newsroom equipped with real-time wire-service feeds and data visualization terminals.

Student editors noted that the equipment parity with commercial broadcasting houses will substantially enhance documentary projects, broadsheet layout workflows, and live coverage of campus events. Regular training workshops led by visiting regional correspondents are scheduled throughout September.`,
    tags: ["College of Communication", "Media Lab", "Broadcasting", "Journalism"]
  },
  {
    id: "uos-times-art-3",
    title: "Where Did All the Writers Go? Investigating Student Literacy in the Era of AI Assistants",
    subtitle: "Faculty and student editors weigh in on writing craftsmanship, individual voice, and the revival of tactile journalism in Sharjah newsrooms.",
    category: "Investigation",
    author: "Noor Al-Qasimi",
    authorRole: "Staff Columnist",
    date: "August 28, 2026",
    readTime: "5 min read",
    featured: false,
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    excerpt: "As generative tools become ubiquitous in lecture halls, University of Sharjah educators are redesigning essays, long-form reporting beats, and handwritten journals to nurture authentic student voice.",
    content: `When the editorial board of The UOS Times reviewed incoming story pitches for the autumn term, an intriguing pattern emerged: while students submitted more text than ever before, the distinctive idiosyncrasies of personal narrative, rhythm, and local vernacular appeared markedly muted.

"Students are producing grammatically flawless prose that occasionally says very little," observes Dr. Rania Haddad, Associate Professor of Mass Media. "Our challenge is no longer teaching syntax; it is nurturing the courage of observation and subjective curiosity."

In response, the Department of Journalism has introduced field notebook requirements, necessitating that reporters conduct in-person interviews without audio-transcription summaries and draft lead paragraphs by hand before moving to digital terminals. The experiment has already produced deeply empathetic dispatches on Sharjah's historic waterfronts, student culinary rituals, and laboratory breakthroughs.`,
    tags: ["Literacy", "AI in Education", "Student Journalism", "Essay"]
  },
  {
    id: "uos-times-art-4",
    title: "Campus Couture: Inside the Fashion Scenarios Transforming Sharjah Student Culture",
    subtitle: "How collegiate streetwear, heritage tailoring, and student fashion collectives are turning university courtyards into open-air runways.",
    category: "Arts & Culture",
    author: "Laila Mansoor",
    authorRole: "Culture Desk",
    date: "August 24, 2026",
    readTime: "3 min read",
    featured: false,
    coverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    excerpt: "From hand-stitched tote bags to experimental abayas, the student body is treating university hallways as runways of personal and cultural identity.",
    content: `Between the marble arcades of the Women's and Men's campuses, fashion at the University of Sharjah has evolved far beyond conventional academic attire into an articulate expression of contemporary Gulf youth identity.

The trend has been captured with viral momentum by UOS Digest's ongoing "Campus Couture" digital series, which highlights how students blend luxury streetwear with bespoke tailoring, traditional Emirati textiles, and upcycled denim.

"Fashion on campus isn't about conspicuous consumerism; it's about intentionality," explains third-year architecture major Hind Al-Marzouqi, whose self-designed structured jackets have caught the eye of Dubai fashion buyers. "Every scarf choice, sneaker rotation, and silhouette is a conscious statement of where we come from and where we are heading."`,
    tags: ["Campus Couture", "Fashion", "Culture", "Student Life"]
  },
  {
    id: "uos-times-art-5",
    title: "Sharjah Inter-Collegiate Athletics: College of Communication Secures Historic Futsal Victory",
    subtitle: "A thrilling 4-3 penalty shootout seals the championship trophy in front of an electric sports complex crowd.",
    category: "Sports",
    author: "Tariq Al-Suwaidi",
    authorRole: "Sports Desk",
    date: "August 19, 2026",
    readTime: "3 min read",
    featured: false,
    coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    excerpt: "In one of the most fiercely contested matches in recent tournament history, Communication held off Engineering in double overtime to claim the university cup.",
    content: `The Sports Complex indoor arena witnessed an unforgettable finale to the annual University of Sharjah Futsal Championship on Thursday night, with the underdog College of Communication squad lifting the Chancellor's Cup following a nail-biting sudden-death shootout against five-time champions Engineering.

Trailing 2-1 with just 45 seconds remaining in regular time, Communication forward Omar Al-Zaabi curled a sensational equalizer from outside the penalty arc, sending hundreds of student supporters into jubilation.

After a scoreless extra time period, goalkeeper Salem Al-Kaabi produced two heroic saves during penalties before team captain Hamad Al-Ali buried the decisive spot-kick into the top right corner. The victory marks the first athletic title for the College of Communication in over seven years.`,
    tags: ["Athletics", "Futsal", "Championship", "Student Sports"]
  },
  {
    id: "uos-times-art-6",
    title: "Editorial: Why Print Broadsheets Still Matter in an Algorithm-Driven University",
    subtitle: "The tactile permanence of paper creates a communal intellectual archive that ephemeral social feeds cannot replicate.",
    category: "Opinion",
    author: "Editorial Board",
    authorRole: "The Press Club Editorial Board",
    date: "August 15, 2026",
    readTime: "4 min read",
    featured: false,
    coverImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
    excerpt: "When you hold a physical copy of The UOS Times, you are engaging with edited, deliberate, and accountable journalism designed to outlast the campus news cycle.",
    content: `In an era where university news travels across ephemeral stories, direct messages, and automated push notifications, the deliberate act of printing ink upon newsprint broadsheets might appear nostalgic to casual observers.

Yet within our academic community, the printed pages of The UOS Times serve an indispensable purpose: permanence. When a broadsheet is laid across a library table or cafeteria bench, it invites shared physical deliberation rather than isolated algorithmic consumption.

A printed report cannot be silently altered or deleted; it demands editorial rigor, accountable attribution, and archival dignity. As student journalists, we remain devoted to both digital speed and physical craftsmanship—ensuring that the vibrant history of the University of Sharjah is documented for generations of scholars yet to arrive.`,
    tags: ["Editorial", "Print Media", "Press Freedom", "Opinion"]
  }
];
