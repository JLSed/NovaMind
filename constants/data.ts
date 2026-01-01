export const MOOD_OPTIONS = [
  { label: "On Fire", emoji: "🔥", desc: "High Energy, High Focus" },
  { label: "Focused", emoji: "🧠", desc: "Calm, Ready" },
  { label: "Anxious", emoji: "😰", desc: "High Energy, Low Focus" },
  { label: "Bored", emoji: "😑", desc: "Low Energy, Low Interest" },
  { label: "Foggy", emoji: "☁️", desc: "Confused, Slow" },
  { label: "Resistance", emoji: "🛑", desc: "Don't want to start" },
  { label: "Drained", emoji: "🔋", desc: "Need rest" },
  { label: "Neutral", emoji: "😐", desc: "Just normal" },
];

export const WAKING_MOOD_OPTIONS = [
  { label: "Refreshed", emoji: "🌅", desc: "Ready to take on the day" },
  { label: "Groggy", emoji: "😵‍💫", desc: "Slow to wake up" },
  { label: "Tired", emoji: "😴", desc: "Didn't sleep enough" },
  { label: "Anxious", emoji: "😰", desc: "Worried about the day" },
  { label: "Excited", emoji: "🤩", desc: "Looking forward to it" },
  { label: "Neutral", emoji: "😐", desc: "Just a normal morning" },
  { label: "Grumpy", emoji: "😠", desc: "Woke up on wrong side of bed" },
  { label: "Rushed", emoji: "🏃", desc: "Running late / Overslept" },
];

export const PHYSICAL_STATE_OPTIONS = [
  { label: "Energetic", emoji: "⚡" },
  { label: "Fatigued", emoji: "🥱" },
  { label: "Sore", emoji: "🏋️" },
  { label: "Tense", emoji: "😬" },
  { label: "Relaxed", emoji: "😌" },
  { label: "Hungry", emoji: "🤤" },
  { label: "Stuffed", emoji: "🍱" },
  { label: "Hydrated", emoji: "💧" },
  { label: "Dehydrated", emoji: "🌵" },
  { label: "Headache", emoji: "🤕" },
  { label: "Nauseous", emoji: "🤢" },
  { label: "Jittery", emoji: "🫨" },
  { label: "Sick", emoji: "🤒" },
  { label: "Groggy", emoji: "😵‍💫" },
];

export const BREAK_TRIGGERS = [
  "Fatigue",
  "Boredom",
  "Scheduled",
  "Stuck/Blocked",
  "Hunger",
];

export const BREAK_INTENTS = ["Recovery", "Procrastination"];

export const BREAK_ACTIVITIES = [
  "Doomscrolling",
  "Social Media",
  "Nap",
  "Walk",
  "Gaming",
  "TV/Series",
  "Youtube Videos",
  "Reading",
  "Eating",
  "Chore",
  "Nothing",
];

export const TAG_CATEGORIES = [
  {
    title: "Fuel (Intake & Biology)",
    tags: [
      "Just Woke Up",
      "Caffeinated",
      "Fasted",
      "Heavy Meal",
      "Hydrated",
      "Sugar Rush",
      "Medicated",
      "Post-Workout",
      "Post-Nap",
    ],
  },
  {
    title: "Environment (Location & Vibe)",
    tags: [
      "Home Office",
      "Cafe / Public",
      "Bedroom",
      "Outdoors",
      "Quiet Zone",
      "Noisy",
      "Cold Room",
      "Warm Room",
    ],
  },
  {
    title: "Sensory (Audio & Visual)",
    tags: [
      "No Music",
      "Lyrical Music",
      "Instrumental / Lo-Fi",
      "White Noise",
      "Phone Away",
      "Notifications On",
    ],
  },
  {
    title: "Pressure (Psychological State)",
    tags: ["Deadline", "Backlog", "Passion", "Forced", "Blocked"],
  },
  {
    title: "Social",
    tags: ["Alone", "Co-working", "Interrupted"],
  },
];
