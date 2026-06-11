/* ------------------------------------------------------------------
   Ryder — sample social data
   Golfers, societies, events and a feed so the social side feels alive.
   In production this comes from the backend; here it's seeded.
------------------------------------------------------------------ */
window.RYDER_SEED = {
  // the signed-in golfer
  me: "p1",

  golfers: [
    { id: "p1",  name: "Jack Parker",   handle: "jackp",      club: "Saunton GC",      loc: "North Devon", hcp: 8,  colour: "green",  rec: { p: 18, w: 9,  h: 3, l: 6 } },
    { id: "p2",  name: "Tom Wallace",   handle: "twallace",   club: "Saunton GC",      loc: "North Devon", hcp: 12, colour: "blue",   rec: { p: 14, w: 6,  h: 2, l: 6 } },
    { id: "p3",  name: "Raj Patel",     handle: "rajp",       club: "Royal North Devon",loc: "Westward Ho!",hcp: 5,  colour: "violet", rec: { p: 22, w: 14, h: 2, l: 6 } },
    { id: "p4",  name: "Olly Bennett",  handle: "ollyb",      club: "Saunton GC",      loc: "Braunton",    hcp: 18, colour: "amber",  rec: { p: 9,  w: 3,  h: 1, l: 5 } },
    { id: "p5",  name: "Sam Doyle",     handle: "samd",       club: "Libbaton GC",     loc: "Umberleigh",  hcp: 14, colour: "teal",   rec: { p: 12, w: 5,  h: 3, l: 4 } },
    { id: "p6",  name: "Chris Mensah",  handle: "cmensah",    club: "Saunton GC",      loc: "Barnstaple",  hcp: 9,  colour: "orange", rec: { p: 16, w: 8,  h: 2, l: 6 } },
    { id: "p7",  name: "Danny Hughes",  handle: "dhughes",    club: "Royal North Devon",loc: "Bideford",   hcp: 7,  colour: "red",    rec: { p: 20, w: 11, h: 4, l: 5 } },
    { id: "p8",  name: "Ben Carter",    handle: "bcarter",    club: "Ilfracombe GC",   loc: "Ilfracombe",  hcp: 11, colour: "indigo", rec: { p: 13, w: 6,  h: 1, l: 6 } },
    { id: "p9",  name: "Marcus Lowe",   handle: "mlowe",      club: "Libbaton GC",     loc: "South Molton",hcp: 16, colour: "pink",   rec: { p: 8,  w: 3,  h: 2, l: 3 } },
    { id: "p10", name: "Will Ferguson", handle: "willf",      club: "Royal North Devon",loc: "Westward Ho!",hcp: 4,  colour: "slate",  rec: { p: 24, w: 15, h: 3, l: 6 } },
    { id: "p11", name: "Aaron Webb",    handle: "awebb",      club: "Ilfracombe GC",   loc: "Ilfracombe",  hcp: 13, colour: "cyan",   rec: { p: 10, w: 4,  h: 2, l: 4 } },
    { id: "p12", name: "Gareth Pugh",   handle: "gpugh",      club: "Saunton GC",      loc: "Braunton",    hcp: 10, colour: "lime",   rec: { p: 15, w: 7,  h: 3, l: 5 } },
    // discoverable golfers nearby (not yet in your society)
    { id: "p13", name: "Priya Shah",    handle: "priyas",     club: "Royal North Devon",loc: "Bideford",   hcp: 6,  colour: "violet", rec: { p: 19, w: 12, h: 1, l: 6 } },
    { id: "p14", name: "Mo Khan",       handle: "mokhan",     club: "Ilfracombe GC",   loc: "Ilfracombe",  hcp: 15, colour: "teal",   rec: { p: 7,  w: 2,  h: 2, l: 3 } },
    { id: "p15", name: "Ellie Frost",   handle: "ellief",     club: "Saunton GC",      loc: "Barnstaple",  hcp: 9,  colour: "pink",   rec: { p: 11, w: 6,  h: 1, l: 4 } },
    { id: "p16", name: "Dave Reece",    handle: "daver",      club: "Libbaton GC",     loc: "Umberleigh",  hcp: 20, colour: "orange", rec: { p: 6,  w: 1,  h: 1, l: 4 } },
  ],

  societies: [
    {
      id: "soc1",
      name: "The Sunday Hackers Society",
      handle: "sundayhackers",
      loc: "North Devon",
      colour: "green",
      about: "A friendly society of ~30 golfers across North Devon. Two Ryder Cup days a year, a winter league, and a lot of banter. All handicaps welcome.",
      founded: "2018",
      members: ["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12","p15"],
      honours: [
        { year: "2025", event: "The Heathland Cup", winner: "Team Azure", score: "8 – 4" },
        { year: "2024", event: "The Heathland Cup", winner: "Team Crimson", score: "7½ – 4½" },
        { year: "2024", event: "Spring Singles Shootout", winner: "Team Azure", score: "9 – 7" },
        { year: "2023", event: "The Heathland Cup", winner: "Team Azure", score: "6½ – 5½" },
      ],
    },
    {
      id: "soc2",
      name: "Burnt Toast Golf Club",
      handle: "burnttoast",
      loc: "Bideford",
      colour: "amber",
      about: "Mates who met on a stag do and never stopped. Monthly roll-ups and one big away day. New players always wanted.",
      founded: "2021",
      members: ["p7","p10","p13","p16"],
      honours: [
        { year: "2025", event: "The Toast Cup", winner: "The Crumbs", score: "8½ – 7½" },
      ],
    },
    {
      id: "soc3",
      name: "Fairway Friday League",
      handle: "fairwayfriday",
      loc: "Exeter",
      colour: "violet",
      about: "After-work fourballs every Friday and a team matchplay season. Sociable, competitive, dog-friendly clubhouse.",
      founded: "2019",
      members: ["p8","p11","p14"],
      honours: [],
    },
    {
      id: "soc4",
      name: "Saunton Seniors",
      handle: "sauntonseniors",
      loc: "Saunton",
      colour: "blue",
      about: "The over-55s of Saunton GC. Tuesday medals and an annual Ryder-style match against Royal North Devon.",
      founded: "2009",
      members: ["p4","p12","p16"],
      honours: [
        { year: "2025", event: "Coast Cup", winner: "Saunton", score: "15 – 9" },
      ],
    },
  ],

  events: [
    {
      id: "ev1",
      title: "The Heathland Cup",
      societyId: "soc1",
      venue: "Saunton GC — East Course",
      date: "Sat 13 June 2026",
      when: "Live now",
      status: "live",
      capacity: 12,
      attendees: ["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12"],
      teams: {
        blue: { id: "blue", name: "Team Azure",   colour: "blue", captain: "Jack Parker" },
        red:  { id: "red",  name: "Team Crimson", colour: "red",  captain: "Danny Hughes" },
      },
      sessions: [
        {
          id: "s1", name: "Friday Fourballs", format: "Fourball (better ball)",
          blurb: "Pairs play their own ball — lowest score wins the hole.",
          matches: [
            { blue: ["p3","p1"], red: ["p10","p7"], status: "final", winner: "blue", margin: "2 & 1" },
            { blue: ["p6","p2"], red: ["p12","p8"], status: "final", winner: "red",   margin: "3 & 2" },
            { blue: ["p5","p4"], red: ["p11","p9"], status: "final", winner: "halved",margin: "AS" },
          ],
        },
        {
          id: "s2", name: "Saturday Foursomes", format: "Foursomes (alternate shot)",
          blurb: "One ball per pair, taking turns to play each shot.",
          matches: [
            { blue: ["p1","p2"], red: ["p7","p8"],  status: "final", winner: "red",  margin: "1 up" },
            { blue: ["p3","p6"], red: ["p10","p12"],status: "live",  winner: null,   thru: 14, state: "Azure 2 up" },
            { blue: ["p4","p5"], red: ["p9","p11"], status: "live",  winner: null,   thru: 12, state: "All square" },
          ],
        },
        {
          id: "s3", name: "Sunday Singles", format: "Singles match play",
          blurb: "Everyone out — one-on-one, a point on the line for each.",
          matches: [
            { blue: ["p1"], red: ["p7"],  status: "soon", winner: null, tee: "09:00" },
            { blue: ["p3"], red: ["p10"], status: "soon", winner: null, tee: "09:10" },
            { blue: ["p6"], red: ["p8"],  status: "soon", winner: null, tee: "09:20" },
            { blue: ["p2"], red: ["p12"], status: "soon", winner: null, tee: "09:30" },
            { blue: ["p5"], red: ["p11"], status: "soon", winner: null, tee: "09:40" },
            { blue: ["p4"], red: ["p9"],  status: "soon", winner: null, tee: "09:50" },
          ],
        },
      ],
    },
    {
      id: "ev2",
      title: "Autumn Foursomes Day",
      societyId: "soc1",
      venue: "Royal North Devon GC",
      date: "Sat 19 Sept 2026",
      when: "in 14 weeks",
      status: "upcoming",
      capacity: 16,
      attendees: ["p1","p2","p3","p6","p7","p10","p11","p12","p15"],
      formats: ["Fourballs", "Foursomes", "Singles"],
      note: "Two-day away trip. £95 a head covers golf, dinner and the cup engraving.",
    },
    {
      id: "ev3",
      title: "The Toast Cup — open day",
      societyId: "soc2",
      venue: "Libbaton GC",
      date: "Sun 5 July 2026",
      when: "in 3 weeks",
      status: "open",
      capacity: 12,
      attendees: ["p7","p10","p13","p16"],
      formats: ["Fourballs", "Singles"],
      note: "Looking for 8 more players to make up the teams — all welcome, come and meet the crew.",
    },
  ],

  // social feed (most recent first)
  feed: [
    {
      id: "f1", type: "event", authorSociety: "soc1", eventId: "ev2", time: "2h",
      text: "Squad! Entries are open for our Autumn away day. Foursomes, fourballs and singles over two days at Royal North Devon. Grab a spot before it fills 👇",
      reactions: { "🔥": 12, "⛳": 7, "👍": 5 },
      comments: [
        { by: "p3", text: "In. Already booked the Friday off 😎", time: "1h" },
        { by: "p6", text: "Same partnership as last year?", time: "44m" },
      ],
    },
    {
      id: "f2", type: "result", authorSociety: "soc1", time: "Yesterday",
      result: { event: "Spring Singles Shootout", blue: 9, red: 7, winnerName: "Team Azure" },
      text: "What a finish — came down to the last green. Team Azure get their hands on the cup 🏆",
      reactions: { "🏆": 21, "🔥": 9, "👍": 6 },
      comments: [
        { by: "p7", text: "Rematch at the Heathland Cup. You're going down 😉", time: "20h" },
      ],
    },
    {
      id: "f3", type: "photo", authorGolfer: "p3", time: "2d", tint: "green",
      caption: "Saunton East looking unreal this morning",
      text: "Best day's golf in ages with the Sunday Hackers. This is why we do it ⛳️",
      reactions: { "⛳": 18, "🔥": 11, "👍": 4 },
      comments: [
        { by: "p15", text: "That 17th green 😍", time: "1d" },
        { by: "p1", text: "Carry me round next time", time: "1d" },
      ],
    },
    {
      id: "f4", type: "event", authorSociety: "soc2", eventId: "ev3", time: "3d",
      text: "First ever Toast Cup and we're short of bodies! If you're near Bideford and fancy a Ryder Cup day with a top crew, jump in — no society membership needed.",
      reactions: { "👍": 8, "⛳": 5 },
      comments: [
        { by: "p13", text: "Tell your mates, the more the merrier 🍞", time: "2d" },
      ],
    },
    {
      id: "f5", type: "join", authorGolfer: "p15", societyId: "soc1", time: "4d",
      text: "joined The Sunday Hackers Society.",
      reactions: { "👋": 14, "👍": 3 }, comments: [],
    },
  ],

  // Golf clubs/courses near you. x/y are % positions on the region map.
  // `match` links a course to golfers (by club) and events (by venue).
  courses: [
    { id: "c1", name: "Saunton Golf Club", match: "Saunton", town: "Braunton", type: "Links",
      holes: 36, par: 71, est: "1897", x: 31, y: 40, colour: "blue", lat: 51.0966, lng: -4.2228,
      blurb: "Two championship links — East & West — laid out through the dunes of Braunton Burrows. A proper test in the wind.",
      facilities: ["2 courses", "Range", "Clubhouse", "Buggies"] },
    { id: "c2", name: "Royal North Devon", match: "Royal North Devon", town: "Westward Ho!", type: "Links",
      holes: 18, par: 71, est: "1864", x: 17, y: 52, colour: "red", lat: 51.0466, lng: -4.2356,
      blurb: "The oldest links course in England — sheep graze the fairways and the sea rushes guard the famous Cape bunker.",
      facilities: ["Historic links", "Range", "Museum", "Visitors welcome"] },
    { id: "c3", name: "Ilfracombe Golf Club", match: "Ilfracombe", town: "Ilfracombe", type: "Clifftop",
      holes: 18, par: 68, est: "1892", x: 38, y: 17, colour: "teal", lat: 51.1996, lng: -4.0928,
      blurb: "Spectacular clifftop golf with sea views from every hole — bring a camera and an extra sleeve of balls.",
      facilities: ["Sea views", "Clubhouse", "Visitors welcome"] },
    { id: "c4", name: "Libbaton Golf Club", match: "Libbaton", town: "Umberleigh", type: "Parkland",
      holes: 18, par: 72, est: "1989", x: 54, y: 64, colour: "green", lat: 50.9889, lng: -3.9986,
      blurb: "Rolling inland parkland that stays playable all winter — gentle on the legs and a friendly society favourite.",
      facilities: ["Range", "Lodges", "Buggies", "Society days"] },
    { id: "c5", name: "Great Torrington", match: "Torrington", town: "Torrington", type: "Heathland",
      holes: 9, par: 35, est: "1895", x: 36, y: 62, colour: "amber", lat: 50.9555, lng: -4.1556,
      blurb: "A characterful nine-holer on common land — quick to get round and perfect for an after-work nine.",
      facilities: ["9 holes", "Common land", "Honesty box"] },
    { id: "c6", name: "Holsworthy Golf Club", match: "Holsworthy", town: "Holsworthy", type: "Parkland",
      holes: 18, par: 71, est: "1937", x: 9, y: 73, colour: "violet", lat: 50.8066, lng: -4.355,
      blurb: "Welcoming parkland on the Devon–Cornwall border with wide fairways and a warm clubhouse.",
      facilities: ["Clubhouse", "Society days", "Visitors welcome"] },
  ],
};

