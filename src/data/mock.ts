export type EventCategory =
  | "Concerts"
  | "Qawwali"
  | "Theatre"
  | "Comedy"
  | "Meetups"
  | "Seminars"
  | "Tournaments"
  | "Exhibitions"
  | "Competitions"
  | "Workshops"
  | "Conferences";

export type OpportunityCategory =
  | "Scholarships"
  | "Internships"
  | "Fellowships"
  | "Hackathons"
  | "Competitions"
  | "Workshops"
  | "MUNs"
  | "Olympiads"
  | "Courses"
  | "Grants";

export type EventMode = "Online" | "Physical";

export interface BaseListing {
  id: string;
  image: string;
  title: string;
  category: string;
  organizer: string;
  organizerLogo?: string;
  description: string;
  location: string;
  city: string;
  mode: EventMode;
  featured?: boolean;
  published: boolean;
}

export interface EventListing extends BaseListing {
  type: "event";
  date: string; // ISO
  time: string;
  venue: string;
  price: number; // 0 = free
  currency: string;
  capacity: number;
  attendees: number;
  ticketTypes: TicketType[];
  gallery?: string[];
  registrationsOpen: boolean;
}

export type FeeType = "free" | "one_time" | "recurring";

export interface OpportunityListing extends BaseListing {
  type: "opportunity";
  deadline: string; // ISO
  requirements: string[];
  eligibility: string[];
  applyUrl: string;
  stipend?: string;
  hasStipend?: boolean;
  price?: number; // 0 = free
  currency?: string;
  feeType: FeeType;
  /** Free-text period for recurring fees (e.g. "4 months", "per semester") */
  feePeriod?: string;
  gallery?: string[];
  registrationsOpen: boolean;
}

export type Listing = EventListing | OpportunityListing;

export interface TicketType {
  id: string;
  name: string;
  price: number;
  currency?: string;
  description?: string;
  perks: string[];
}

export interface Ticket {
  id: string;
  eventId: string;
  event: Pick<
    EventListing,
    "title" | "image" | "category" | "venue" | "city" | "date" | "time"
  >;
  type: string;
  status: "upcoming" | "past";
  qr: string;
  price: number;
  purchasedAt: string;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  bio: string;
  city: string;
  joined: string;
  interests: string[];
  preferences: {
    categories: string[];
    distanceKm: number;
    notifications: boolean;
    newsletter: boolean;
  };
}

export interface Organizer {
  id: string;
  name: string;
  logo: string;
  eventsCount: number;
  followers: number;
}

const img = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const gallery = (id: string, n: number): string[] =>
  Array.from({ length: n }, (_, i) => img(`${id}-g${i}`, 1200, 800));

export const events: EventListing[] = [
  {
    id: "e1",
    type: "event",
    image: img("concert1"),
    title: "Aurora Live: The Mirror Tour",
    category: "Concerts",
    organizer: "Stellar Entertainment",
    description:
      "Experience Aurora's ethereal vocals in an intimate night of live music, including songs from her newest album, special guest performances and an immersive light show.",
    location: "Brooklyn Steel",
    city: "New York, USA",
    mode: "Physical",
    featured: true,
    published: true,
    registrationsOpen: true,
    date: "2026-10-12",
    time: "20:00",
    venue: "Brooklyn Steel",
    price: 85,
    currency: "PKR",
    capacity: 1800,
    attendees: 1240,
    ticketTypes: [
      { id: "t1", name: "General", price: 85, perks: ["Entry", "Standing"] },
      { id: "t2", name: "VIP", price: 180, perks: ["Entry", "Seated", "Merch"] },
      {
        id: "t3",
        name: "Meet & Greet",
        price: 320,
        perks: ["VIP", "Photo", "Signed Poster"],
      },
    ],
    gallery: gallery("e1", 5),
  },
  {
    id: "e2",
    type: "event",
    image: img("qawwali1"),
    title: "Nights of Qawwali — Rahat Fateh Ali Khan",
    category: "Qawwali",
    organizer: "Heritage Music Co.",
    description:
      "A spiritual evening celebrating the legacy of Qawwali with performances by Rahat Fateh Ali Khan and his ensemble.",
    location: "Royal Albert Hall",
    city: "London, UK",
    mode: "Physical",
    featured: true,
    published: true,
    registrationsOpen: true,
    date: "2026-09-28",
    time: "19:30",
    venue: "Royal Albert Hall",
    price: 120,
    currency: "PKR",
    capacity: 5000,
    attendees: 4180,
    ticketTypes: [
      { id: "t1", name: "Stalls", price: 120, perks: ["Seated"] },
      { id: "t2", name: "Circle", price: 95, perks: ["Seated", "Upper Tier"] },
    ],
    gallery: gallery("e2", 4),
  },
  {
    id: "e3",
    type: "event",
    image: img("theatre1"),
    title: "Hamlet Reimagined",
    category: "Theatre",
    organizer: "Royal Stage Co.",
    description:
      "A modern adaptation of Shakespeare's classic, blending traditional staging with immersive projection design.",
    location: "Globe Theatre",
    city: "London, UK",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    date: "2026-10-05",
    time: "19:00",
    venue: "Globe Theatre",
    price: 45,
    currency: "PKR",
    capacity: 800,
    attendees: 612,
    ticketTypes: [
      { id: "t1", name: "Standard", price: 45, perks: ["Seated"] },
      { id: "t2", name: "Premium", price: 75, perks: ["Front rows", "Programme"] },
    ],
  },
  {
    id: "e4",
    type: "event",
    image: img("comedy1"),
    title: "Stand-Up Night with Hasan Minhaj",
    category: "Comedy",
    organizer: "Laugh Lab",
    description:
      "An evening of sharp, observational comedy from Hasan Minhaj — new material, no filters.",
    location: "The Improv",
    city: "Los Angeles, USA",
    mode: "Physical",
    featured: true,
    published: true,
    registrationsOpen: true,
    date: "2026-10-19",
    time: "21:00",
    venue: "The Improv Hollywood",
    price: 65,
    currency: "PKR",
    capacity: 500,
    attendees: 498,
    ticketTypes: [
      { id: "t1", name: "General", price: 65, perks: ["Entry"] },
    ],
    gallery: gallery("e4", 3),
  },
  {
    id: "e5",
    type: "event",
    image: img("meetup1"),
    title: "Designers × Founders Mixer",
    category: "Meetups",
    organizer: "Figma Community",
    description:
      "Casual networking night bringing together product designers and early-stage founders. Drinks, light bites and great conversations.",
    location: "WeWork Soho",
    city: "New York, USA",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    date: "2026-09-26",
    time: "18:30",
    venue: "WeWork Soho",
    price: 0,
    currency: "PKR",
    capacity: 120,
    attendees: 87,
    ticketTypes: [
      { id: "t1", name: "Free Pass", price: 0, perks: ["Entry", "Drinks"] },
    ],
  },
  {
    id: "e6",
    type: "event",
    image: img("seminar1"),
    title: "The Future of AI in Healthcare",
    category: "Seminars",
    organizer: "MIT Media Lab",
    description:
      "A panel of clinicians and AI researchers discuss what's real, what's hype, and what's next for AI in medicine.",
    location: "MIT Media Lab",
    city: "Cambridge, USA",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    date: "2026-10-08",
    time: "14:00",
    venue: "MIT Media Lab, Hall 6",
    price: 25,
    currency: "PKR",
    capacity: 300,
    attendees: 198,
    ticketTypes: [
      { id: "t1", name: "Standard", price: 25, perks: ["Entry", "Coffee"] },
    ],
  },
  {
    id: "e7",
    type: "event",
    image: img("tournament1"),
    title: "BTS Champions Cup — Regional Finals",
    category: "Tournaments",
    organizer: "Eclipse Esports",
    description:
      "Top 16 teams battle for the regional title and a $50,000 prize pool. Watch live with full casters and big screens.",
    location: "Kairos Arena",
    city: "Berlin, Germany",
    mode: "Physical",
    featured: true,
    published: true,
    registrationsOpen: true,
    date: "2026-10-22",
    time: "10:00",
    venue: "Kairos Arena",
    price: 35,
    currency: "PKR",
    capacity: 4200,
    attendees: 3800,
    ticketTypes: [
      { id: "t1", name: "Day Pass", price: 35, perks: ["Entry"] },
      { id: "t2", name: "VIP", price: 95, perks: ["Lounge", "Food", "Swag"] },
    ],
  },
  {
    id: "e8",
    type: "event",
    image: img("exhibition1"),
    title: "Form & Function — Modern Furniture Expo",
    category: "Exhibitions",
    organizer: "Design Museum",
    description:
      "A curated exhibition of contemporary furniture from 40+ designers across Europe, North America and Asia.",
    location: "Design Museum",
    city: "London, UK",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    date: "2026-10-15",
    time: "11:00",
    venue: "Design Museum",
    price: 18,
    currency: "PKR",
    capacity: 600,
    attendees: 412,
    ticketTypes: [
      { id: "t1", name: "Adult", price: 18, perks: ["Entry"] },
      { id: "t2", name: "Student", price: 9, perks: ["Entry", "ID Required"] },
    ],
  },
  {
    id: "e9",
    type: "event",
    image: img("competition1"),
    title: "Global Startup Pitch Night",
    category: "Competitions",
    organizer: "Y Combinator",
    description:
      "20 early-stage founders pitch to leading VCs. $500K in prizes and a chance at term-sheet conversations.",
    location: "Y Combinator HQ",
    city: "San Francisco, USA",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    date: "2026-10-30",
    time: "17:00",
    venue: "Y Combinator, Mountain View",
    price: 0,
    currency: "PKR",
    capacity: 250,
    attendees: 220,
    ticketTypes: [
      { id: "t1", name: "Spectator", price: 0, perks: ["Entry"] },
    ],
  },
  {
    id: "e10",
    type: "event",
    image: img("workshop1"),
    title: "Watercolor & Wine — Beginner Workshop",
    category: "Workshops",
    organizer: "Studio 9",
    description:
      "A relaxed evening of watercolor painting with all materials provided. Perfect for absolute beginners.",
    location: "Studio 9",
    city: "Brooklyn, USA",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    date: "2026-10-02",
    time: "19:00",
    venue: "Studio 9, Brooklyn",
    price: 55,
    currency: "PKR",
    capacity: 24,
    attendees: 19,
    ticketTypes: [
      { id: "t1", name: "Standard", price: 55, perks: ["Materials", "Wine"] },
    ],
  },
  {
    id: "e11",
    type: "event",
    image: img("conference1"),
    title: "DevConf 2026 — Engineering at Scale",
    category: "Conferences",
    organizer: "DevConf Global",
    description:
      "Three days of talks from engineers at Netflix, Stripe, Cloudflare and more. Topics include distributed systems, AI infra and platform engineering.",
    location: "Moscone Center",
    city: "San Francisco, USA",
    mode: "Physical",
    featured: true,
    published: true,
    registrationsOpen: true,
    date: "2026-11-04",
    time: "09:00",
    venue: "Moscone Center West",
    price: 499,
    currency: "PKR",
    capacity: 5000,
    attendees: 3120,
    ticketTypes: [
      { id: "t1", name: "Early Bird", price: 499, perks: ["3 Days", "Talks"] },
      {
        id: "t2",
        name: "Pro",
        price: 799,
        perks: ["3 Days", "Workshops", "Networking"],
      },
      {
        id: "t3",
        name: "Team",
        price: 2200,
        perks: ["5 Passes", "Booth", "Workshop Access"],
      },
    ],
  },
  {
    id: "e12",
    type: "event",
    image: img("concert2"),
    title: "Lahore Music Festival — Day 2",
    category: "Concerts",
    organizer: "City of Lahore",
    description:
      "The second day of Pakistan's biggest open-air music festival with 20+ artists across 3 stages.",
    location: "Gulberg Greens",
    city: "Lahore, Pakistan",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    date: "2026-10-18",
    time: "16:00",
    venue: "Gulberg Greens Open Grounds",
    price: 30,
    currency: "PKR",
    capacity: 12000,
    attendees: 8400,
    ticketTypes: [
      { id: "t1", name: "Day Pass", price: 30, perks: ["Entry"] },
      {
        id: "t2",
        name: "VIP",
        price: 95,
        perks: ["Lounge", "Food", "Private Bar"],
      },
    ],
  },
];

export const opportunities: OpportunityListing[] = [
  {
    id: "o1",
    type: "opportunity",
    image: img("sch1"),
    title: "Rhodes Scholarship 2027",
    category: "Scholarships",
    organizer: "Rhodes Trust",
    description:
      "A fully-funded postgraduate award for study at the University of Oxford. Covers tuition, living stipend and travel.",
    location: "Oxford, UK",
    city: "Oxford, UK",
    mode: "Online",
    featured: true,
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-10-15",
    requirements: [
      "Bachelor's degree or equivalent",
      "Outstanding academic record",
      "Leadership and service",
      "Two reference letters",
    ],
    eligibility: ["Citizens of eligible countries", "Aged 18–28"],
    applyUrl: "#",
    stipend: "Full funding + stipend",
    gallery: gallery("o1", 4),
  },
  {
    id: "o2",
    type: "opportunity",
    image: img("intern1"),
    title: "Stripe Software Engineer Intern — Summer 2027",
    category: "Internships",
    organizer: "Stripe",
    description:
      "12-week paid engineering internship working on real systems that move money globally. Open to undergraduates and graduate students.",
    location: "South San Francisco / Remote",
    city: "Remote",
    mode: "Online",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-11-01",
    requirements: [
      "Currently enrolled in a CS or related program",
      "Proficiency in at least one modern language",
      "Prior project or internship experience",
    ],
    eligibility: ["Students graduating 2027 or 2028"],
    applyUrl: "#",
    stipend: "₨ 10,000/month",
  },
  {
    id: "o3",
    type: "opportunity",
    image: img("fellow1"),
    title: "Google DeepMind Research Fellowship",
    category: "Fellowships",
    organizer: "Google DeepMind",
    description:
      "A 2-year research fellowship working alongside DeepMind scientists on foundational AI research.",
    location: "London, UK",
    city: "London, UK",
    mode: "Physical",
    featured: true,
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-10-25",
    requirements: [
      "PhD or equivalent research experience in ML, CS, Math",
      "Strong publication record",
      "Research statement",
    ],
    eligibility: ["Open to all nationalities"],
    applyUrl: "#",
    stipend: "£120,000+/year",
    gallery: gallery("o3", 3),
  },
  {
    id: "o4",
    type: "opportunity",
    image: img("hack1"),
    title: "TreeHacks 2026 — Stanford's Premier Hackathon",
    category: "Hackathons",
    organizer: "Stanford Hackathon Club",
    description:
      "36-hour hackathon with $100K in prizes, top-tier mentors and the best of Stanford's engineering community.",
    location: "Stanford University",
    city: "Stanford, USA",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-10-09",
    requirements: [
      "Student or recent graduate",
      "Team of 1–4",
      "Application form + project idea",
    ],
    eligibility: ["University students worldwide"],
    applyUrl: "#",
    stipend: "₨ 100,000 in prizes",
    gallery: gallery("o4", 5),
  },
  {
    id: "o5",
    type: "opportunity",
    image: img("comp1"),
    title: "ICPC World Finals — Regional Round",
    category: "Competitions",
    organizer: "ICPC Foundation",
    description:
      "The regional round of the International Collegiate Programming Contest. Top teams advance to World Finals.",
    location: "Multiple regions",
    city: "Online / Multiple",
    mode: "Online",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-10-20",
    requirements: [
      "Team of 3 university students",
      "Coach from same university",
      "Account verified",
    ],
    eligibility: ["University students, 5 years max enrolment"],
    applyUrl: "#",
  },
  {
    id: "o6",
    type: "opportunity",
    image: img("ws1"),
    title: "Product Management Bootcamp — Cohort 12",
    category: "Workshops",
    organizer: "Reforge",
    description:
      "8-week intensive program covering user research, product strategy, and growth frameworks. Live sessions + cohort.",
    location: "Online",
    city: "Remote",
    mode: "Online",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-10-12",
    requirements: [
      "2+ years experience preferred",
      "Application form",
      "Commitment for full 8 weeks",
    ],
    eligibility: ["Working professionals"],
    applyUrl: "#",
    stipend: "Scholarships available",
  },
  {
    id: "o7",
    type: "opportunity",
    image: img("mun1"),
    title: "Harvard WorldMUN 2027 — Delegate Applications",
    category: "MUNs",
    organizer: "Harvard WorldMUN",
    description:
      "The world's most prestigious Model United Nations conference. 5 days of committee sessions in the heart of Boston.",
    location: "Boston, USA",
    city: "Boston, USA",
    mode: "Physical",
    featured: true,
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-11-15",
    requirements: [
      "University student",
      "MUN experience (preferred)",
      "Position paper",
    ],
    eligibility: ["University students 18+"],
    applyUrl: "#",
  },
  {
    id: "o8",
    type: "opportunity",
    image: img("oly1"),
    title: "International Mathematical Olympiad — Team Selection",
    category: "Olympiads",
    organizer: "Mathematical Association",
    description:
      "Country-wide selection process for the IMO team. Train with the country's top coaches and represent your nation.",
    location: "Multiple centers",
    city: "Multiple",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-10-30",
    requirements: [
      "High school student",
      "Proof of mathematical background",
      "Country citizenship",
    ],
    eligibility: ["Pre-university students"],
    applyUrl: "#",
  },
  {
    id: "o9",
    type: "opportunity",
    image: img("course1"),
    title: "Deep Learning Specialization — Coursera",
    category: "Courses",
    organizer: "DeepLearning.AI",
    description:
      "5-course specialization by Andrew Ng covering neural networks, CNNs, sequence models and best practices.",
    location: "Online",
    city: "Remote",
    mode: "Online",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-12-31",
    requirements: ["Basic Python", "Some linear algebra"],
    eligibility: ["Open to all"],
    applyUrl: "#",
    stipend: "Free to audit",
  },
  {
    id: "o10",
    type: "opportunity",
    image: img("grant1"),
    title: "Mozilla Responsible AI Grants",
    category: "Grants",
    organizer: "Mozilla Foundation",
    description:
      "Funding between $25,000 and $100,000 for projects examining the social impact of AI and working toward more trustworthy technology.",
    location: "Global / Remote",
    city: "Remote",
    mode: "Online",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-11-10",
    requirements: [
      "Project proposal (5 pages)",
      "Team bios",
      "Budget breakdown",
    ],
    eligibility: ["Researchers, nonprofits, journalists"],
    applyUrl: "#",
    stipend: "₨ 25,000 – ₨ 100,000",
  },
  {
    id: "o11",
    type: "opportunity",
    image: img("sch2"),
    title: "Fulbright Foreign Student Program",
    category: "Scholarships",
    organizer: "U.S. Department of State",
    description:
      "Funded master's and PhD study in the United States across all disciplines. One of the most prestigious international scholarships.",
    location: "USA",
    city: "USA",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-10-15",
    requirements: [
      "Bachelor's degree",
      "Strong academics",
      "English proficiency",
      "Three reference letters",
    ],
    eligibility: ["Citizens of participating countries"],
    applyUrl: "#",
    stipend: "Full funding",
  },
  {
    id: "o12",
    type: "opportunity",
    image: img("intern2"),
    title: "UNDP Young Professionals Programme",
    category: "Internships",
    organizer: "United Nations",
    description:
      "Rotational program for young professionals to start a career at the United Nations Development Programme.",
    location: "Global",
    city: "Multiple",
    mode: "Physical",
    published: true,
    registrationsOpen: true,
    feeType: "free",
    hasStipend: false,
    deadline: "2026-11-30",
    requirements: [
      "Master's degree",
      "Under 32 years old",
      "Fluency in English",
    ],
    eligibility: ["Nationals of UNDP member states"],
    applyUrl: "#",
    stipend: "Competitive + benefits",
  },
];

export const tickets: Ticket[] = [
  {
    id: "tk1",
    eventId: "e1",
    event: {
      title: events[0].title,
      image: events[0].image,
      category: events[0].category,
      venue: events[0].venue,
      city: events[0].city,
      date: events[0].date,
      time: events[0].time,
    },
    type: "VIP",
    status: "upcoming",
    qr: "OC-2026-AURORA-VIP",
    price: 180,
    purchasedAt: "2026-09-12",
  },
  {
    id: "tk2",
    eventId: "e11",
    event: {
      title: events[10].title,
      image: events[10].image,
      category: events[10].category,
      venue: events[10].venue,
      city: events[10].city,
      date: events[10].date,
      time: events[10].time,
    },
    type: "Early Bird",
    status: "upcoming",
    qr: "OC-2026-DEVCONF-EB",
    price: 499,
    purchasedAt: "2026-09-08",
  },
  {
    id: "tk3",
    eventId: "e8",
    event: {
      title: events[7].title,
      image: events[7].image,
      category: events[7].category,
      venue: events[7].venue,
      city: events[7].city,
      date: events[7].date,
      time: events[7].time,
    },
    type: "Adult",
    status: "upcoming",
    qr: "OC-2026-FORM-ADULT",
    price: 18,
    purchasedAt: "2026-09-20",
  },
  {
    id: "tk4",
    eventId: "old1",
    event: {
      title: "Open Mic Night — Spring Showcase",
      image: img("oldmic"),
      category: "Comedy",
      venue: "Comedy Cellar",
      city: "New York, USA",
      date: "2026-04-14",
      time: "20:00",
    },
    type: "General",
    status: "past",
    qr: "OC-2026-MIC-GEN",
    price: 12,
    purchasedAt: "2026-04-01",
  },
  {
    id: "tk5",
    eventId: "old2",
    event: {
      title: "Jazz on the Green",
      image: img("jazz"),
      category: "Concerts",
      venue: "Bryant Park",
      city: "New York, USA",
      date: "2026-06-22",
      time: "19:00",
    },
    type: "Standard",
    status: "past",
    qr: "OC-2026-JAZZ-STD",
    price: 0,
    purchasedAt: "2026-06-01",
  },
];

export const user: User = {
  id: "u1",
  name: "Aisha Rahman",
  handle: "@aisharahman",
  email: "aisha@occaz.app",
  avatar: img("avatar1", 240, 240),
  bio: "Designer, runner, terrible cook. Always looking for concerts and design meetups.",
  city: "New York, USA",
  joined: "March 2025",
  interests: ["Concerts", "Workshops", "Hackathons", "Design", "Fellowships"],
  preferences: {
    categories: ["Concerts", "Workshops", "Hackathons"],
    distanceKm: 25,
    notifications: true,
    newsletter: false,
  },
};

export const savedEventIds: string[] = ["e2", "e4", "e11"];
export const savedOpportunityIds: string[] = ["o1", "o3", "o9"];

export const categories: EventCategory[] = [
  "Concerts",
  "Qawwali",
  "Theatre",
  "Comedy",
  "Meetups",
  "Seminars",
  "Tournaments",
  "Exhibitions",
  "Competitions",
  "Workshops",
  "Conferences",
];

export const opportunityCategories: OpportunityCategory[] = [
  "Scholarships",
  "Internships",
  "Fellowships",
  "Hackathons",
  "Competitions",
  "Workshops",
  "MUNs",
  "Olympiads",
  "Courses",
  "Grants",
];

export const organizers: Organizer[] = [
  {
    id: "org1",
    name: "Stellar Entertainment",
    logo: img("org1", 200, 200),
    eventsCount: 28,
    followers: 12400,
  },
  {
    id: "org2",
    name: "Heritage Music Co.",
    logo: img("org2", 200, 200),
    eventsCount: 14,
    followers: 8200,
  },
  {
    id: "org3",
    name: "Y Combinator",
    logo: img("org3", 200, 200),
    eventsCount: 96,
    followers: 248000,
  },
  {
    id: "org4",
    name: "MIT Media Lab",
    logo: img("org4", 200, 200),
    eventsCount: 142,
    followers: 198000,
  },
  {
    id: "org5",
    name: "DeepLearning.AI",
    logo: img("org5", 200, 200),
    eventsCount: 8,
    followers: 412000,
  },
  {
    id: "org6",
    name: "Reforge",
    logo: img("org6", 200, 200),
    eventsCount: 22,
    followers: 34800,
  },
];

export const cities: string[] = [
  "All Cities",
  "New York, USA",
  "London, UK",
  "San Francisco, USA",
  "Los Angeles, USA",
  "Berlin, Germany",
  "Lahore, Pakistan",
  "Cambridge, USA",
  "Boston, USA",
  "Stanford, USA",
  "Remote",
  "Multiple",
];

export const getEventById = (id: string) =>
  events.find((e) => e.id === id);

export const getOpportunityById = (id: string) =>
  opportunities.find((o) => o.id === id);

export const formatDate = (iso: string) => {
  if (!iso) return "Open";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Open";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const formatDateLong = (iso: string) => {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatPrice = (n: number, currency = "PKR") => {
  if (n === 0) return "Free";
  // PKR doesn't have a widely-supported fractional unit; keep whole numbers.
  if (currency === "PKR") {
    return `₨ ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
};
