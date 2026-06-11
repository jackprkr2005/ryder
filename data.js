/* ------------------------------------------------------------------
   Ryder — sample event data
   A realistic, half-played day out so the scoreboard looks alive.
   In a real deployment this comes from the backend / local storage.
------------------------------------------------------------------ */
window.RYDER_SEED = {
  event: {
    name: "The Heathland Cup",
    venue: "Saunton Golf Club — East Course",
    date: "Saturday 13 June 2026",
    society: "The Sunday Hackers Society",
    status: "live",
  },

  teams: {
    blue: { id: "blue", name: "Team Azure", colour: "blue", captain: "Jack Parker" },
    red:  { id: "red",  name: "Team Crimson", colour: "red",  captain: "Danny Hughes" },
  },

  // handicap = playing handicap for the day
  players: [
    // Team Azure
    { id: "p1",  name: "Jack Parker",    team: "blue", hcp: 8,  captain: true },
    { id: "p2",  name: "Tom Wallace",    team: "blue", hcp: 12 },
    { id: "p3",  name: "Raj Patel",      team: "blue", hcp: 5  },
    { id: "p4",  name: "Olly Bennett",   team: "blue", hcp: 18 },
    { id: "p5",  name: "Sam Doyle",      team: "blue", hcp: 14 },
    { id: "p6",  name: "Chris Mensah",   team: "blue", hcp: 9  },
    // Team Crimson
    { id: "p7",  name: "Danny Hughes",   team: "red",  hcp: 7,  captain: true },
    { id: "p8",  name: "Ben Carter",     team: "red",  hcp: 11 },
    { id: "p9",  name: "Marcus Lowe",    team: "red",  hcp: 16 },
    { id: "p10", name: "Will Ferguson",  team: "red",  hcp: 4  },
    { id: "p11", name: "Aaron Webb",     team: "red",  hcp: 13 },
    { id: "p12", name: "Gareth Pugh",    team: "red",  hcp: 10 },
  ],

  // Each session is a classic Ryder Cup format.
  // result winner: "blue" | "red" | "halved" | null (not finished)
  // margin: e.g. "3 & 2", "1 up", "AS"
  sessions: [
    {
      id: "s1",
      name: "Friday Fourballs",
      format: "Fourball (better ball)",
      blurb: "Pairs play their own ball — lowest score wins the hole.",
      matches: [
        { blue: ["p3","p1"], red: ["p10","p7"], status: "final", winner: "blue", margin: "2 & 1" },
        { blue: ["p6","p2"], red: ["p12","p8"], status: "final", winner: "red",   margin: "3 & 2" },
        { blue: ["p5","p4"], red: ["p11","p9"], status: "final", winner: "halved",margin: "AS" },
      ],
    },
    {
      id: "s2",
      name: "Saturday Foursomes",
      format: "Foursomes (alternate shot)",
      blurb: "One ball per pair, taking turns to play each shot.",
      matches: [
        { blue: ["p1","p2"], red: ["p7","p8"],  status: "final", winner: "red",  margin: "1 up" },
        { blue: ["p3","p6"], red: ["p10","p12"],status: "live",  winner: null,   thru: 14, state: "Azure 2 up" },
        { blue: ["p4","p5"], red: ["p9","p11"], status: "live",  winner: null,   thru: 12, state: "All square" },
      ],
    },
    {
      id: "s3",
      name: "Sunday Singles",
      format: "Singles match play",
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
};
