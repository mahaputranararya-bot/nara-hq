// Helpers for turning a mini-game outcome into placements and points.
// An "order" is an array of groups, best first: [[2], [0, 3], [1]] means P2 won, P0+P3 tied 2nd...

// scores: array indexed by player. higher = better unless lowerWins.
export function rankByScore(scores, lowerWins = false) {
  const idx = scores.map((s, i) => i).sort((a, b) => (lowerWins ? scores[a] - scores[b] : scores[b] - scores[a]));
  const groups = [];
  for (const i of idx) {
    const lastG = groups[groups.length - 1];
    if (lastG && scores[lastG[0]] === scores[i]) lastG.push(i); else groups.push([i]);
  }
  return groups;
}
// alive: indices still in; outOrder: array of indices or arrays (same-moment knockouts) in the order they went out.
export function rankByElimination(alive, outOrder) {
  const groups = [];
  if (alive.length) groups.push([...alive]);
  for (let k = outOrder.length - 1; k >= 0; k--) groups.push(Array.isArray(outOrder[k]) ? [...outOrder[k]] : [outOrder[k]]);
  return groups;
}
// teams: array of arrays of player indices, teamOrder: team indices best first
export function rankTeams(teams, teamOrder) { return teamOrder.map((ti) => [...teams[ti]]); }

export const POINTS = [3, 2, 1];
// returns { points: [...per player], place: [...per player, 1-based] }
export function pointsFor(order, n) {
  const points = new Array(n).fill(0), place = new Array(n).fill(n);
  let p = 1;
  order.forEach((grp, gi) => {
    for (const i of grp) {
      place[i] = p;
      if (order.length === 1) points[i] = 1;            // everybody tied
      else if (gi === order.length - 1) points[i] = 0;  // last place never scores
      else points[i] = POINTS[p - 1] || 0;
    }
    p += grp.length;
  });
  return { points, place };
}
