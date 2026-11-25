/* Functionia — kingdom metadata (pure). Colours, rulers, topics, map positions. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.F = root.F || {}; root.F.realm = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var kingdoms = {
    mir: { id: 'mir', name: 'Mirrorvale', ruler: 'The Mirror Queen', rulerKey: 'queen', topic: 'Functions, reflections & inverses',
      short: 'Inverses', color: '#8EC5FF', accent: '#B59CF2', deep: '#2E3F7A', light: '#EAF3FF', gift: 'Mirror segment: you can now see the y = x line on other maps.',
      map: { x: -0.30, y: 0.28 }, motif: 'crystal' },
    lin: { id: 'lin', name: 'Lineara', ruler: 'The Steady King', rulerKey: 'king', topic: 'Linear functions y = mx + b',
      short: 'Linear', color: '#F2C14E', accent: '#7BC96F', deep: '#6B5414', light: '#FFF6DB', gift: 'Slope compass: later graphs show the slope m.',
      map: { x: -0.36, y: -0.10 }, motif: 'windmill' },
    par: { id: 'par', name: 'Parabolis', ruler: 'The Archer Lord', rulerKey: 'archer', topic: 'Quadratics: vertex, axis, roots',
      short: 'Quadratic', color: '#F08A3C', accent: '#B8323A', deep: '#6A2A12', light: '#FFE9DA', gift: 'Golden arrow: it always flies true.',
      map: { x: 0.36, y: -0.10 }, motif: 'peaks' },
    cub: { id: 'cub', name: 'Cubrion', ruler: 'The Serpent Duke', rulerKey: 'serpent', topic: 'Cubics: shape, roots, end behaviour',
      short: 'Cubic', color: '#2BB3A3', accent: '#D9B77E', deep: '#2B1F45', light: '#DDF7F3', gift: 'River scale: it shimmers when a curve turns.',
      map: { x: 0.00, y: 0.36 }, motif: 'canyon' },
    exp: { id: 'exp', name: 'Expona', ruler: 'The Bloom Witch', rulerKey: 'witch', topic: 'Exponentials: growth, decay, asymptote',
      short: 'Exponential', color: '#9BE15D', accent: '#D6409F', deep: '#1E4A22', light: '#ECFADD', gift: 'A magic seed that grows on the map as the realm heals.',
      map: { x: 0.30, y: 0.28 }, motif: 'jungle' },
    rat: { id: 'rat', name: 'Rationalis', ruler: 'The Asymptote Warden', rulerKey: 'warden', topic: 'Rational functions: asymptotes, holes, domain',
      short: 'Rational', color: '#7C6CFF', accent: '#FF4D6D', deep: '#14122E', light: '#E7E4FF', gift: '',
      map: { x: 0.00, y: -0.34 }, motif: 'fortress' }
  };
  var speakers = {
    ori: { name: 'Ori', color: '#FFC94A' },
    delta: { name: 'Delta', color: '#E8604C' },
    glitch: { name: 'The Glitch', color: '#FF4D6D' },
    narrator: { name: '', color: '#C9D3FF' },
    queen: { name: 'The Mirror Queen', color: '#B59CF2' },
    king: { name: 'The Steady King', color: '#F2C14E' },
    archer: { name: 'The Archer Lord', color: '#F08A3C' },
    serpent: { name: 'The Serpent Duke', color: '#2BB3A3' },
    witch: { name: 'The Bloom Witch', color: '#D6409F' },
    warden: { name: 'The Asymptote Warden', color: '#7C6CFF' }
  };
  return {
    order: ['mir', 'lin', 'par', 'cub', 'exp', 'rat'],
    middle: ['lin', 'par', 'cub', 'exp'],
    recommended: ['lin', 'par', 'exp', 'cub'],
    kingdoms: kingdoms,
    speakers: speakers
  };
});
