/* Functionia — f(x)plained Shorts, one per kingdom.
 * HOW TO FILL IN: paste the YouTube Shorts link between the quotes of `url`, e.g.
 *   url: 'https://youtube.com/shorts/abc123'
 * An empty url shows a friendly "Coming soon on f(x)plained!" card. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.F = root.F || {}; root.F.shorts = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    channel: 'f(x)plained',
    list: {
      mir: { title: 'Inverse Functions in 60 Seconds', url: '' },
      lin: { title: 'Slope: Rise Over Run', url: '' },
      par: { title: 'Find the Vertex of Any Parabola', url: '' },
      cub: { title: 'Cubic End Behaviour, Fast', url: '' },
      exp: { title: 'Growth vs Decay: It’s All About b', url: '' },
      rat: { title: 'Asymptotes: Walls You Can’t Touch', url: '' }
    }
  };
});
