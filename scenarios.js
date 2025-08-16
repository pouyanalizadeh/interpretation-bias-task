// scenarios.js
// 32 four-line scenarios with a single-word benign/threat completion
const SCENARIOS = [
  { id: 1,
    lines: [
      "You watch your partner sit up slowly in the morning.",
      "They roll their shoulders and take a long breath.",
      "After a minute, they walk to the kitchen.",
      "The tight feeling in their back seems like a ____"
    ],
    benign: "stiffness", threat: "injury"
  },
  { id: 2,
    lines: [
      "You climb the stairs together with a light bag.",
      "At the top, your partner pauses, chatting as they breathe.",
      "They smile and keep walking.",
      "The quick pause feels like ordinary ____"
    ],
    benign: "exertion", threat: "distress"
  },
  { id: 3,
    lines: [
      "A mug slips and chips on the counter.",
      "Your partner flexes their fingers and picks up the pieces.",
      "They rotate the wrist and make a fist.",
      "The slip looks like simple ____"
    ],
    benign: "clumsiness", threat: "weakness"
  },
  { id: 4,
    lines: [
      "In bed, your partner shifts position with a soft “mm.”",
      "They slide a pillow under a knee and settle.",
      "Their breathing eases within a minute.",
      "The sound was a brief sign of ____"
    ],
    benign: "discomfort", threat: "damage"
  },
  { id: 5,
    lines: [
      "At dinner, your partner talks less but smiles at your story.",
      "They finish most of the meal and stretch afterward.",
      "They suggest making tea.",
      "The quieter mood reflects normal ____"
    ],
    benign: "tiredness", threat: "flare"
  },
  { id: 6,
    lines: [
      "A long checkout line creeps forward.",
      "Your partner shifts weight and rubs the lower back.",
      "They lean on the cart and keep chatting.",
      "The shifting looks like routine ____"
    ],
    benign: "pacing", threat: "aggravation"
  },
  { id: 7,
    lines: [
      "Your partner reschedules coffee for Saturday.",
      "They propose a new time and add a smiley.",
      "The friend replies “perfect.”",
      "The change seems like energy ____"
    ],
    benign: "budgeting", threat: "withdrawal"
  },
  { id: 8,
    lines: [
      "After a hot shower, your partner sits on the tub edge briefly.",
      "Steam lingers as they towel off.",
      "They stand and dress without help.",
      "The pause was a short ____"
    ],
    benign: "break", threat: "setback"
  },
  { id: 9,
    lines: [
      "A coworker calls about a deadline.",
      "Your partner rubs a temple and opens the laptop.",
      "They map tasks on a notepad and start.",
      "The temple rub signals ordinary ____"
    ],
    benign: "strain", threat: "migraine"
  },
  { id: 10,
    lines: [
      "Ten minutes into a walk, your partner points to a bench.",
      "You sit, chat a few minutes, then continue.",
      "The rest of the walk is relaxed.",
      "The bench stop was smart ____"
    ],
    benign: "pacing", threat: "limitation"
  },
  { id: 11,
    lines: [
      "Your partner arrives 30 minutes later than planned.",
      "They mention a detour and traffic cones.",
      "They unpack groceries and play music.",
      "The delay was mostly ____"
    ],
    benign: "logistics", threat: "symptoms"
  },
  { id: 12,
    lines: [
      "Mid-movie, they stand to stretch and roll the neck.",
      "They place a cushion behind the back and sit.",
      "They focus on the screen again.",
      "The stretch is a comfort ____"
    ],
    benign: "strategy", threat: "warning"
  },
  { id: 13,
    lines: [
      "Halfway through dinner, they wrap leftovers for lunch.",
      "They say lunch was bigger than usual.",
      "They ask for fruit afterward.",
      "The smaller portion reflects normal ____"
    ],
    benign: "variation", threat: "decline"
  },
  { id: 14,
    lines: [
      "At night, your partner wakes and shifts position.",
      "They check the clock and close their eyes.",
      "Breathing slows within minutes.",
      "The brief wake was typical ____"
    ],
    benign: "repositioning", threat: "insomnia"
  },
  { id: 15,
    lines: [
      "A faint menthol scent hangs in the bedroom.",
      "Your partner nods toward a small tube on the shelf.",
      "They shrug and pick up a book.",
      "The scent suggests minor ____"
    ],
    benign: "ache", threat: "relapse"
  },
  { id: 16,
    lines: [
      "Your partner reads a short article on back care.",
      "They bookmark a stretch and smile.",
      "They say, “I might try this tomorrow.”",
      "The reading shows helpful ____"
    ],
    benign: "curiosity", threat: "anxiety"
  },
  { id: 17,
    lines: [
      "At bedtime, they realize a morning pill was missed.",
      "They set an alarm and note it in the app.",
      "Lights off a minute later.",
      "The miss looks like simple ____"
    ],
    benign: "oversight", threat: "mismanagement"
  },
  { id: 18,
    lines: [
      "At the mall, your partner picks a closer spot.",
      "They laugh, “Save steps for inside.”",
      "You head in together.",
      "The choice reflects smart ____"
    ],
    benign: "planning", threat: "decline"
  },
  { id: 19,
    lines: [
      "Today they take the elevator at work.",
      "They mention yesterday’s long stair day.",
      "Later they walk the hallway.",
      "The choice supports balanced ____"
    ],
    benign: "recovery", threat: "deconditioning"
  },
  { id: 20,
    lines: [
      "At a friend’s place, they suggest leaving a bit early.",
      "They thank the host warmly and wave.",
      "In the car, they say it was fun.",
      "The timing shows wise ____"
    ],
    benign: "pacing", threat: "avoidance"
  },
  { id: 21,
    lines: [
      "They move physio from 8 a.m. to 11 a.m.",
      "They say, “That window suits me better.”",
      "A reminder pops up on the phone.",
      "The change signals thoughtful ____"
    ],
    benign: "scheduling", threat: "procrastination"
  },
  { id: 22,
    lines: [
      "On a road trip, they ask you to drive after an hour.",
      "They stretch and offer to navigate.",
      "Music plays as the trip continues.",
      "The swap is simple load ____"
    ],
    benign: "sharing", threat: "decline"
  },
  { id: 23,
    lines: [
      "Carrying two hot drinks, their hand trembles briefly.",
      "They use both hands and walk steadily.",
      "Cups reach the table without spill.",
      "The tremor looks like heat-related ____"
    ],
    benign: "response", threat: "deterioration"
  },
  { id: 24,
    lines: [
      "You hug your partner and they say, “Softer’s nicer.”",
      "You adjust and they relax into it.",
      "You both linger for a moment.",
      "The feedback guides comfortable ____"
    ],
    benign: "connection", threat: "hypersensitivity"
  },
  { id: 25,
    lines: [
      "Afternoon sun warms the couch; they doze 20 minutes.",
      "They wake and suggest a short walk.",
      "You grab shoes and head out.",
      "The nap was restorative ____"
    ],
    benign: "rest", threat: "exhaustion"
  },
  { id: 26,
    lines: [
      "A small parcel arrives: heat wrap and gel cold pack.",
      "“Good to have options,” they say.",
      "They place them in a nearby drawer.",
      "The purchase shows proactive ____"
    ],
    benign: "self-care", threat: "dependence"
  },
  { id: 27,
    lines: [
      "In a video call, they sign off a bit early.",
      "They leave a cheerful note in chat.",
      "Later they text thanks for the invite.",
      "The early exit reflects healthy ____"
    ],
    benign: "boundaries", threat: "isolation"
  },
  { id: 28,
    lines: [
      "You both plan to move a heavy box.",
      "They suggest splitting it into two trips.",
      "The box gets moved without strain.",
      "The plan prioritizes safe ____"
    ],
    benign: "technique", threat: "fragility"
  },
  { id: 29,
    lines: [
      "After an appointment, they’re quiet in the car.",
      "They say, “I’ll read the summary tonight.”",
      "Later they sit with the notes.",
      "The quiet reflects thoughtful ____"
    ],
    benign: "processing", threat: "worry"
  },
  { id: 30,
    lines: [
      "They check a step counter and smile.",
      "“Hit my goal; I’ll keep tomorrow lighter.”",
      "They set a reminder for the morning.",
      "The plan helps avoid tomorrow’s ____"
    ],
    benign: "overload", threat: "collapse"
  },
  { id: 31,
    lines: [
      "A cold wind blows at the bus stop.",
      "Your partner rubs a knee and stamps their feet.",
      "On the bus, their hands warm up.",
      "The knee rub was weather-related ____"
    ],
    benign: "stiffness", threat: "damage"
  },
  { id: 32,
    lines: [
      "During a tender moment, they whisper, “Slower feels better.”",
      "They guide your hand and exhale softly.",
      "You adjust and they smile.",
      "The cue invites comfort-focused ____"
    ],
    benign: "intimacy", threat: "difficulty"
  }
];

// expose globally for app.js
window.SCENARIOS = SCENARIOS;
