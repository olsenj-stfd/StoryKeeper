export const CURATED_BRANCHES = [
  "Suddenly, a friendly badger poked its head out of the bushes.",
  "The wind blew, and a paper map drifted down from the sky.",
  "A tiny door appeared on the side of an old oak tree.",
  "Everything started to glow softly, like fireflies waking up.",
  "A small voice giggled from somewhere nearby.",
  "The grass turned bright blue, just for a moment.",
  "A path of smooth river stones stretched ahead.",
  "An old woman with a kind smile waved from a porch.",
  "It started to rain marshmallows. Just a few.",
  "A cat with one green eye and one blue eye trotted past.",
  "Something shiny twinkled near a tree root.",
  "The clouds rearranged themselves to spell a word.",
  "A breeze carried the smell of warm bread from somewhere.",
  "A small rabbit dropped a tiny envelope at their feet.",
  "The path forked — one way bright, one way mossy and cool.",
];

export function pickBranches(n: number = 4): string[] {
  return [...CURATED_BRANCHES].sort(() => Math.random() - 0.5).slice(0, n);
}

// Legacy alias — prefer pickBranches(n) for new code.
export const pickThreeBranches = () => pickBranches(3);
