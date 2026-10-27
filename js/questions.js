// Questions asked one at a time, in this order.
//
// Each question filters meals on one property of the meals in js/meals.js:
//   id      unique name for the question
//   field   the meal property this question checks (e.g. "temp", "minutes")
//   title   the question text
//   multiple  optional; true lets you pick several options (a meal then
//             needs to fit any one of them), with a Next button to move on
//   options the answers to pick from; each option uses ONE of these filters:
//     value: "x"          meal[field] is "x" (or contains "x" if it's a list)
//     values: ["x", "y"]  meal[field] is any of these
//     min / max: number   meal[field] is within the range
//     any: true           no filter ("Surprise me")
//
// Options can also set `animate` to make their emoji move: roll, flicker,
// spin, zap, flip, sway, wiggle, bounce, swim or shake (see css/styles.css).
//
// Meals that don't have the field at all are never filtered out, so you can
// add a new question before tagging every meal with the new property.

// Every question ends with this "doesn't matter" option.
const SURPRISE = { any: true, emoji: "🎲", animate: "roll", label: "Surprise me", hint: "Doesn't matter" };

window.QUESTIONS = [
  {
    id: "eaters",
    field: "eaters",
    title: "Who's eating?",
    options: [
      { value: "solo", emoji: "🙋", animate: "wiggle", label: "Just me", hint: "A plate for one" },
      { value: "family", emoji: "👨‍👩‍👧‍👦", animate: "bounce", label: "Family", hint: "Feeds the whole table" },
      SURPRISE
    ]
  },
  {
    id: "type",
    field: "type",
    title: "Small bite or a full meal?",
    multiple: true,
    options: [
      { value: "small", emoji: "🥪", animate: "wiggle", label: "Small bite", hint: "Something light, even for dinner" },
      { value: "full", emoji: "🍝", animate: "bounce", label: "Full meal", hint: "A proper plate" },
      SURPRISE
    ]
  },
  {
    id: "temp",
    field: "temp",
    title: "Hot or cold?",
    multiple: true,
    options: [
      { value: "hot", emoji: "🔥", animate: "flicker", label: "Hot", hint: "Something warm" },
      { value: "cold", emoji: "❄️", animate: "spin", label: "Cold", hint: "Fresh and chilled" },
      SURPRISE
    ]
  },
  {
    id: "time",
    field: "minutes",
    title: "Do you have time to cook?",
    options: [
      { max: 20, emoji: "⚡", animate: "zap", label: "In a rush", hint: "20 minutes or less" },
      { any: true, emoji: "⏳", animate: "flip", label: "I've got time", hint: "Slow-cooked is fine" },
      SURPRISE
    ]
  },
  {
    id: "diet",
    field: "diet",
    title: "What are you in the mood for?",
    multiple: true,
    options: [
      { value: "vegan", emoji: "🌱", animate: "sway", label: "Vegan", hint: "Fully plant-based" },
      { values: ["vegan", "vegetarian"], emoji: "🥕", animate: "wiggle", label: "Vegetarian", hint: "Includes vegan dishes" },
      { value: "chicken", emoji: "🍗", animate: "bounce", label: "Chicken", hint: "Poultry" },
      { value: "fish", emoji: "🐟", animate: "swim", label: "Fish", hint: "Fish & seafood" },
      { value: "meat", emoji: "🥩", animate: "shake", label: "Meat", hint: "Beef, pork, lamb" },
      SURPRISE
    ]
  },
  {
    id: "cuisine",
    field: "cuisine",
    title: "What cuisine?",
    multiple: true,
    options: [
      { value: "lebanese", emoji: "🌲", animate: "sway", label: "Lebanese", hint: "Akl beyte, mezze, tabekh" },
      { value: "asian", emoji: "🥢", animate: "wiggle", label: "Asian", hint: "Noodles, rice, curries" },
      { value: "italian", emoji: "🍕", animate: "spin", label: "Italian", hint: "Pasta, pizza, risotto" },
      { value: "mexican", emoji: "🌮", animate: "bounce", label: "Mexican", hint: "Tacos, burritos, fajitas" },
      { value: "american", emoji: "🌭", animate: "wiggle", label: "American", hint: "Burgers, wings, diner classics" },
      { value: "other", emoji: "🌍", animate: "spin", label: "Something else", hint: "Greek, British, French…" },
      SURPRISE
    ]
  },
  {
    id: "mood",
    field: "mood",
    title: "Light or comfort?",
    multiple: true,
    options: [
      { value: "light", emoji: "🥗", animate: "sway", label: "Healthy & fresh", hint: "Light and clean" },
      { value: "hearty", emoji: "🍲", animate: "bounce", label: "Hearty & cosy", hint: "Warm-hug food" },
      { value: "khabbousa", emoji: "🍔", animate: "shake", label: "Khabbousa", hint: "Messy, greasy, zero regrets" },
      SURPRISE
    ]
  },
  {
    id: "budget",
    field: "budget",
    title: "What's the budget?",
    multiple: true,
    options: [
      { value: "cheap", emoji: "🪙", animate: "spin", label: "Cheap", hint: "Pantry staples" },
      { value: "moderate", emoji: "💳", animate: "wiggle", label: "Moderate", hint: "A normal shop" },
      { value: "treat", emoji: "💎", animate: "flicker", label: "Treat", hint: "Go on, splurge" },
      SURPRISE
    ]
  }
];
