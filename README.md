# What To Eat

**Shu mnekol? Let the wheel decide.**

Answer a few quick questions (who's eating, small bite or full meal, hot or cold, time, diet, cuisine, mood and budget), spin the wheel and get a meal idea. Respin until something sounds good. 180+ dishes, from Lebanese akl beyte to proper khabbousa.

Pure static site: HTML + CSS + vanilla JS, with the dishes in `js/meals.js`. No server or build step.

## Run locally

Just open `index.html` in a browser.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` / `/ (root)`.
3. Your site is live at `https://<user>.github.io/<repo>/`.

## Adding dishes

Add an object to the `window.MEALS` array in `js/meals.js`:

```json
{
  "name": "Dish name",
  "emoji": "🍲",
  "type": "small | full",
  "temp": "hot | cold",
  "minutes": 25,
  "diet": "vegan | vegetarian | chicken | fish | meat",
  "cuisine": "lebanese | asian | italian | mexican | american | other",
  "eaters": "solo | family",
  "mood": "light | hearty | khabbousa",
  "budget": "cheap | moderate | treat",
  "description": "One-line pitch.",
  "ingredients": ["Thing", "Other thing"]
}
```

A dish that works more than one way can list several values for any of these, e.g. `"type": ["small", "full"]`, `"eaters": ["solo", "family"]` or `"diet": ["meat", "vegan"]` for tabekh you can make with or without meat. It then shows up for any of those answers. Vegan dishes don't need `"vegetarian"` too; the Vegetarian answer already includes them.

Optionally add `"recipe": "https://www.notion.so/..."` to link the dish to your own recipe page; the result card then shows **My own recipe ↗** instead of a Google search. In Notion, use **Share → Copy link**. For other people to open it, the page must also be published (**Share → Publish**); otherwise only you, signed in, can see it.

You can add any extra properties (e.g. `"spicy": true`), then ask about them with a new question.

## Adding questions

Questions live in `js/questions.js`, in the order they're asked. Each one points at a meal property (`field`), and each option says how to filter it:

```js
{
  id: "spice",
  field: "spicy",               // property on the meals in js/meals.js
  title: "Feeling brave?",
  multiple: false,              // true = pick several answers, then press Next
  options: [
    { value: true, emoji: "🌶️", label: "Bring the heat", hint: "Spicy only" },
    { value: false, emoji: "😌", label: "Keep it mild", hint: "No spice" },
    SURPRISE                    // the shared "🎲 Surprise me / Doesn't matter" option
  ]
}
```

Option filters:

| Option | Matches meals where |
| --- | --- |
| `value: "x"` | the property is `"x"` (or contains it, if it's a list) |
| `values: ["x", "y"]` | the property is any of these (how "Vegetarian" includes vegan dishes) |
| `min: 10, max: 20` | the property is a number in that range (how "In a rush" works on `minutes`) |
| `any: true` | always (no filter) |

Add `animate: "<name>"` to an option to animate its emoji: `roll`, `flicker`, `spin`, `zap`, `flip`, `sway`, `wiggle`, `bounce`, `swim` or `shake` (defined in `css/styles.css`).

Meals that don't have the property yet always pass, so a new question won't empty the wheel before you've tagged your dishes. The answer you pick also shows up as a tag on the result card.
