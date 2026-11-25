/* Functionia — cosmetics (pure). Purely visual. Unlocked by stars, golden puzzles or story progress.
 * unlock: {stars:N} | {golden:true} | {restored:'exp'} | {restoredAll:true} | {shards:6} | {start:true} */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.F = root.F || {}; root.F.cosmetics = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var items = [
    // scarf colours
    { id: 'scarf-blue', slot: 'scarf', name: 'Sky Scarf', color: '#3BA7D9', unlock: { start: true } },
    { id: 'scarf-coral', slot: 'scarf', name: 'Delta Coral', color: '#E8604C', unlock: { stars: 5 } },
    { id: 'scarf-mint', slot: 'scarf', name: 'Mint Breeze', color: '#4CC9A0', unlock: { stars: 15 } },
    { id: 'scarf-lilac', slot: 'scarf', name: 'Mirror Lilac', color: '#B59CF2', unlock: { stars: 30 } },
    { id: 'scarf-sunset', slot: 'scarf', name: 'Archer Sunset', color: '#F08A3C', unlock: { stars: 50 } },
    { id: 'scarf-night', slot: 'scarf', name: 'Asymptote Night', color: '#3B3F8C', unlock: { stars: 80 } },
    { id: 'scarf-gold', slot: 'scarf', name: 'Golden Scarf', color: '#FFD24A', unlock: { golden: true } },
    { id: 'scarf-static', slot: 'scarf', name: 'Static Scarf', color: '#FF4D6D', unlock: { shards: 6 } },
    // scarf patterns
    { id: 'pattern-plain', slot: 'pattern', name: 'Plain', unlock: { start: true } },
    { id: 'pattern-stripes', slot: 'pattern', name: 'Stripes', unlock: { stars: 10 } },
    { id: 'pattern-dots', slot: 'pattern', name: 'Polka Dots', unlock: { stars: 40 } },
    { id: 'pattern-zigzag', slot: 'pattern', name: 'Zigzag', unlock: { golden: true } },
    { id: 'pattern-stars', slot: 'pattern', name: 'Starry', unlock: { stars: 100 } },
    // trails
    { id: 'trail-dots', slot: 'trail', name: 'Dots', unlock: { start: true } },
    { id: 'trail-stars', slot: 'trail', name: 'Stars', unlock: { stars: 20 } },
    { id: 'trail-sparkles', slot: 'trail', name: 'Sparkles', unlock: { stars: 60 } },
    { id: 'trail-hearts', slot: 'trail', name: 'Hearts', unlock: { golden: true } },
    { id: 'trail-rainbow', slot: 'trail', name: 'Rainbow', unlock: { golden: true } },
    { id: 'trail-glitch', slot: 'trail', name: 'Friendly Static', unlock: { restoredAll: true } },
    // Delta hats
    { id: 'hat-none', slot: 'hat', name: 'No hat', unlock: { start: true } },
    { id: 'hat-party', slot: 'hat', name: 'Party Hat', unlock: { stars: 8 } },
    { id: 'hat-beanie', slot: 'hat', name: 'Cosy Beanie', unlock: { stars: 25 } },
    { id: 'hat-grad', slot: 'hat', name: 'Graduation Cap', unlock: { stars: 35 } },
    { id: 'hat-flower', slot: 'hat', name: 'Flower Crown', unlock: { restored: 'exp' } },
    { id: 'hat-wizard', slot: 'hat', name: 'Wizard Hat', unlock: { golden: true } },
    { id: 'hat-crown', slot: 'hat', name: 'Royal Crown', unlock: { restoredAll: true } }
  ];
  var slots = [
    { id: 'scarf', name: 'Scarf colour' }, { id: 'pattern', name: 'Scarf pattern' },
    { id: 'trail', name: 'Trail' }, { id: 'hat', name: 'Delta’s hat' }
  ];
  var goldenPool = items.filter(function (i) { return i.unlock.golden; }).map(function (i) { return i.id; });
  function byId(id) { return items.filter(function (i) { return i.id === id; })[0]; }
  function describe(u) {
    if (u.start) return 'Starter';
    if (u.stars) return u.stars + ' ★';
    if (u.golden) return 'Golden puzzle reward';
    if (u.restored) return 'Restore Expona';
    if (u.restoredAll) return 'Restore all six kingdoms';
    if (u.shards) return 'Find all 6 Glitch Shards';
    return '';
  }
  return { items: items, slots: slots, goldenPool: goldenPool, byId: byId, describe: describe };
});
