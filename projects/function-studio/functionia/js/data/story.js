/* Functionia — all story dialogue (pure). Each line: [speaker, text]. Max 25 words per line (tested).
 * Glitch speech uses combining strokes: g('text') turns "you" into "y̷o̷u̷". */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.F = root.F || {}; root.F.story = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function g(s) { return s.split('').map(function (ch) { return ch === ' ' ? ' ' : ch + '̷'; }).join(''); }

  var scenes = {
    opening: {
      title: 'The Shattering', lines: [
        ['narrator', 'Long ago, Functionia was one realm, drawn on the Grand Graph.'],
        ['narrator', 'Six kingdoms lived by six rules, and every rule met at the centre: the Origin, (0, 0).'],
        ['narrator', 'Then something escaped from the one place no rule could fill: the hole at x = 0 in y = 1/x.'],
        ['narrator', 'The Glitch. A creature made of undefined values. It shattered the Grand Graph and twisted every rule.'],
        ['narrator', 'But in the dark, at the very centre, a tiny spark began to glow…']
      ]
    },
    wake: {
      title: 'A Point Wakes Up', lines: [
        ['ori', '…Huh? Where am I? Why is everything so… broken?'],
        ['ori', 'And why is there a number floating over my head? (0, 0)? Is that me?'],
        ['delta', 'You’re… a point? At the Origin? That’s impossible. Everything else got stuck!'],
        ['delta', 'I’m Delta. It means “change”. I study how things move… when they CAN move.'],
        ['ori', 'I’m… Ori! Short for Origin, I think. Can I move? Can I try? Please?'],
        ['delta', 'Carefully! Every point here follows a rule. Your badge shows your coordinates: where you are on the graph.'],
        ['delta', 'The bridge to Mirrorvale is broken. Fix it, and maybe the Mirror Queen can tell us what happened.']
      ]
    },
    bridgeDone: {
      title: 'The First Plank', lines: [
        ['ori', 'We did it! Look, my badge stopped flickering!'],
        ['delta', 'Reflecting across y = x just swaps x and y. You learn fast, little point.']
      ]
    },
    tileBefore: {
      title: 'A Strange Tile', lines: [
        ['ori', 'Ooh, a shiny tile! It says x = 0 ÷ 0. What if I step on it? What happens? Just one hop!']
      ]
    },
    tileAfter: {
      title: 'A Strange Tile', lines: [
        ['glitch', g('hehe… NaN… NaN…')],
        ['delta', 'Don’t do that! Some inputs break the rules. 0 ÷ 0 has no answer at all.'],
        ['delta', 'But breaking a model on purpose shows us where its rules stop. Let’s learn which inputs are dangerous.'],
        ['ori', 'So breaking the model is… science? I LOVE science!']
      ]
    },
    glimpse: {
      title: 'The Dark Fortress', lines: [
        ['delta', 'Look over there. That dark fortress is Rationalis, where The Glitch escaped.'],
        ['glitch', g('you belong with me')],
        ['ori', 'Did that voice just… talk to me?'],
        ['delta', 'First things first. Mirrorvale needs us. One kingdom at a time.']
      ]
    },
    mapFirst: {
      title: 'Four Roads Open', lines: [
        ['delta', 'Mirrorvale shines again! Now four kingdoms are open: Lineara, Parabolis, Cubrion and Expona.'],
        ['delta', 'Go in any order you like. I’d suggest Lineara, Parabolis, Expona, then Cubrion. But you choose!'],
        ['ori', 'And Practice Mode and the Puzzle of the Day are open too! So many buttons!']
      ]
    },
    ratUnlock: {
      title: 'The Fog Lifts', lines: [
        ['delta', 'Five kingdoms restored! The fog around Rationalis is lifting.'],
        ['glitch', g('come home, Ori')],
        ['ori', 'It knows my name. Delta… I think it’s time.']
      ]
    },

    // ---------------- Mirrorvale ----------------
    'mir-intro': { title: 'The Mirror Queen', lines: [
      ['queen', 'A visitor? Don’t look at my mirror, darling. It’s… having a bad day.'],
      ['queen', 'The Glitch broke it. My reflection flips the wrong way, and it won’t swap back with me!'],
      ['ori', 'We can fix reflections! We just fixed a whole bridge with one!'],
      ['queen', 'Then restore my rule, little point. Learn the ways of mirrors, and pass my trial.'],
      ['delta', 'Our goal: restore the Mirror Queen’s rule. Start with Learn. I’ll explain each idea as we go.']
    ] },
    'mir-learnDone': { title: 'Mirror Lessons', lines: [
      ['queen', 'Swaps, scanners, machines and undoing. You catch on quickly. How charming.'],
      ['delta', 'Now Practice. The numbers change every time, so you really learn it.']
    ] },
    'mir-practiceDone': { title: 'Clearer Reflections', lines: [
      ['queen', 'My mirror shows a little more of me with every answer. Ready for my trial?']
    ] },
    'mir-trialStart': { title: 'The Queen’s Trial', lines: [
      ['queen', 'My trial has no previews, darling. Predict first, then test. Like a true royal.']
    ] },
    'mir-thanks': { title: 'Mirrorvale Restored', lines: [
      ['queen', 'My reflection is back! And it swaps perfectly. I look… magnificent.'],
      ['queen', 'Take this mirror segment for your ring. You’ll see the line y = x on other maps now.'],
      ['queen', 'One more thing. Your reflection, little point… it flickers like IT does.'],
      ['ori', 'Like… The Glitch? What does that mean?'],
      ['delta', 'Let’s find out. Four kingdoms are open now, and you choose where we go next.']
    ] },
    'mir-callback': { title: 'Back in Mirrorvale', lines: [
      ['queen', 'Ori! My mirror still sparkles, thanks to you. Across y = x, just swap. Simple and elegant, like me.']
    ] },

    // ---------------- Lineara ----------------
    'lin-intro': { title: 'The Steady King', lines: [
      ['king', 'Halt! Who goes there? Oh. A point. Good. Points are steady. I like steady.'],
      ['king', 'But my roads! My perfectly straight roads bend at random now. I can’t stand surprises!'],
      ['delta', 'A straight road has a constant rate of change. The Glitch must be changing it.'],
      ['king', 'Then make my roads straight again. Same slope, every step. That’s how a kingdom should run.']
    ] },
    'lin-learnDone': { title: 'Steady Lessons', lines: [
      ['king', 'Rise over run. Fee plus rate. Beautiful. Predictable. I may actually cry.']
    ] },
    'lin-practiceDone': { title: 'Straighter Roads', lines: [
      ['king', 'Every road you build stays built. Steady progress. My favourite kind.']
    ] },
    'lin-trialStart': { title: 'The King’s Trial', lines: [
      ['king', 'My trial: no previews, no wobbly sliders. Calculate, then commit. Steady!']
    ] },
    'lin-thanks': { title: 'Lineara Restored', lines: [
      ['king', 'Straight! All of them, straight as rulers! Thank you, Ori.'],
      ['king', 'Take my slope compass. It will show you m on the graphs you visit.'],
      ['king', 'Strange thing. The Glitch’s tracks all started at the Origin. Same place you woke up. Curious, isn’t it?'],
      ['ori', 'The Origin… where I was born?']
    ] },
    'lin-callback': { title: 'Back in Lineara', lines: [
      ['king', 'Ori! The roads haven’t bent once since you left. Not once! A constant rate of change. Bliss.']
    ] },

    // ---------------- Parabolis ----------------
    'par-intro': { title: 'The Archer Lord', lines: [
      ['archer', 'Behold! The Archer Lord, the greatest aim in all of Functionia! Watch this shot!'],
      ['archer', '…That was a warm-up. My arrows have simply chosen new landing spots.'],
      ['delta', 'Your arrows fly in parabolas. The Glitch has twisted their vertex and roots.'],
      ['archer', 'I have NOT lost my aim! But… perhaps you could help me find it. Quietly.']
    ] },
    'par-learnDone': { title: 'Arrow Lessons', lines: [
      ['archer', 'Vertex, axis, roots! You speak the language of arrows!']
    ] },
    'par-practiceDone': { title: 'Truer Shots', lines: [
      ['archer', 'Magnificent shots! Almost as good as mine. Almost.']
    ] },
    'par-trialStart': { title: 'The Archer’s Trial', lines: [
      ['archer', 'My trial has no aiming guides. A true archer predicts the path before letting go!']
    ] },
    'par-thanks': { title: 'Parabolis Restored', lines: [
      ['archer', 'Bullseye after bullseye! My aim is back! Not that it ever left.'],
      ['archer', 'Take this golden arrow. It always flies true.'],
      ['archer', 'Though… when my arrows missed, they all flew toward the hole in Rationalis. And toward you, Ori.'],
      ['delta', 'Toward Ori? That’s… odd.']
    ] },
    'par-callback': { title: 'Back in Parabolis', lines: [
      ['archer', 'Ori! I hit fifty bullseyes today. I counted. The vertex is the peak of every great shot!']
    ] },

    // ---------------- Cubrion ----------------
    'cub-intro': { title: 'The Serpent Duke', lines: [
      ['serpent', 'Sssso. A golden point and a triangle bird enter my canyonsss.'],
      ['serpent', 'Riddle me this: what twists and twists, has no end, and has lost its way?'],
      ['ori', 'Um… a really long noodle?'],
      ['serpent', '…My river. It twists so badly that I am lost in my own canyons. I no longer know where it ends.'],
      ['delta', 'Cubic rivers! Their roots, turning points and end behaviour tell you everything.']
    ] },
    'cub-learnDone': { title: 'River Lessons', lines: [
      ['serpent', 'You echo through the origin like a true Cubrion. Delightful.']
    ] },
    'cub-practiceDone': { title: 'Calmer Water', lines: [
      ['serpent', 'The river remembers each answer. It flows more calmly now.']
    ] },
    'cub-trialStart': { title: 'The Duke’s Trial', lines: [
      ['serpent', 'My trial is a riddle with no previewsss. Predict, then sssee.']
    ] },
    'cub-thanks': { title: 'Cubrion Restored', lines: [
      ['serpent', 'The river flows from where it began to where it ends. I can see its endsss again.'],
      ['serpent', 'Take this river scale. It shimmers whenever a curve changes direction.'],
      ['serpent', 'A final riddle: what was born in the same spark, but runs in opposite directions?'],
      ['ori', 'Another riddle? Is the answer… me?']
    ] },
    'cub-callback': { title: 'Back in Cubrion', lines: [
      ['serpent', 'Ah, Ori. The river sendsss its regards. Odd functions echo through the origin. So do good friendsss.']
    ] },

    // ---------------- Expona ----------------
    'exp-intro': { title: 'The Bloom Witch', lines: [
      ['witch', 'Oh, hello! Mind the slime! It doubles every hour. It’s very enthusiastic!'],
      ['witch', 'And my torch keeps halving. Grow, shrink, grow, shrink! The Glitch made my garden chaotic. Well, MORE chaotic.'],
      ['delta', 'Exponential rules multiply by b each step. Growth if b > 1, decay if b is between 0 and 1.'],
      ['witch', 'Fix my bases, little sunbeam, and I’ll give you something lovely!']
    ] },
    'exp-learnDone': { title: 'Garden Lessons', lines: [
      ['witch', 'You understand b! Most visitors just scream at the slime.']
    ] },
    'exp-practiceDone': { title: 'A Calmer Garden', lines: [
      ['witch', 'The slime is behaving! It only doubles a reasonable amount now.']
    ] },
    'exp-trialStart': { title: 'The Witch’s Trial', lines: [
      ['witch', 'My trial! Careful with words: “at most” and “below” are not the same spell!']
    ] },
    'exp-thanks': { title: 'Expona Restored', lines: [
      ['witch', 'My garden is balanced again! Growth where it should grow, decay where it should fade.'],
      ['witch', 'Take this seed. It will grow on your map as you heal the realm.'],
      ['witch', 'My oldest seed sprouted the night the Graph broke. Two sparks flew: one gold, one static.'],
      ['ori', 'One gold… like me. And one static… like The Glitch?']
    ] },
    'exp-callback': { title: 'Back in Expona', lines: [
      ['witch', 'Sunbeam! Your seed is growing beautifully. Exponentially, even! Remember: b = 1 just sits there.']
    ] },

    // ---------------- Rationalis ----------------
    'rat-intro': { title: 'The Asymptote Warden', lines: [
      ['warden', 'HALT. NONE MAY PASS THE WALLS. NONE MAY TOUCH THE WALLS.'],
      ['delta', 'That’s the Asymptote Warden. The Glitch has corrupted him!'],
      ['warden', 'The walls… can be approached forever… but never… touched…'],
      ['ori', 'Then we’ll learn the walls. All of them. And we’ll set you free!']
    ] },
    'rat-learnDone': { title: 'Wall Lessons', lines: [
      ['warden', 'Walls… doors… holes… you understand them. The static… is weakening.']
    ] },
    'rat-practiceDone': { title: 'Remembering', lines: [
      ['warden', 'Ori… is that your name? I remember now. I am a guardian, not a prisoner.']
    ] },
    'rat-trialStart': { title: 'The Warden’s Trial', lines: [
      ['warden', 'Prove you know my walls, and I will open the way to The Glitch.']
    ] },
    'rat-thanks': { title: 'The Warden Is Free', lines: [
      ['warden', 'I am free! Thank you. I am the Asymptote Warden, keeper of the walls.'],
      ['warden', 'The Glitch hides beyond my walls. Ori, it came from the hole at x = 0. So did you.'],
      ['warden', 'One spark, two sides. You are the point that belongs everywhere. It is the value that belongs nowhere.'],
      ['ori', 'So we’re… like twins? That’s why my reflection flickers.'],
      ['delta', 'Whatever happens, I’m with you. Every skill you learned will help now.']
    ] },
    'rat-callback': { title: 'Back in Rationalis', lines: [
      ['warden', 'Welcome back, Ori. The walls stand firm, and the hole at x = 0 has a very proud guardian.']
    ] },
    bossIntro: { title: 'The Glitch', lines: [
      ['glitch', g('FINALLY') + '. Little point. Did you come to delete me?'],
      ['ori', 'We came to fix Functionia. Whatever that means for you.'],
      ['glitch', 'Every rule has a place for everyone. Except me. ' + g('NO PLACE') + '.'],
      ['delta', 'Use everything you learned! Mirrors, roads, arrows, rivers, seeds and walls!']
    ] },
    finale: { title: 'A Place for Everyone', lines: [
      ['glitch', 'Trapped… between walls I can’t cross. That’s all I ever was. A place no rule can reach.'],
      ['ori', 'Wait. Every function has places it can’t go. That’s not a flaw. It’s part of the rule!'],
      ['ori', 'y = 1/x can’t touch x = 0. But x = 0 still matters. It shapes the whole graph!'],
      ['glitch', '…It does?'],
      ['ori', 'Someone has to look after the edges: the holes, the walls, the domain boundaries. Want the job?'],
      ['warden', 'Guardian of the hole at x = 0. Keeper of every domain boundary. It is an honourable post.'],
      ['glitch', 'A… home? For me? ' + g('No one ever') + '… Okay. Okay! I’ll guard them well.'],
      ['delta', 'Look! The Grand Graph is rebuilding itself!'],
      ['queen', 'Every kingdom is shining again. And at the centre, our little Origin.'],
      ['ori', 'Not just me. All of us. Every rule meets here, even the ones with holes.']
    ] },

    // ---------------- Glitch Zones ----------------
    'mir-zone': { title: 'Mirror Lab', lines: [
      ['ori', 'A mirror lab! What if I reflect y = x² across y = x? Is it still a function?'],
      ['delta', 'Try it, then scan it. In the Glitch Zone, breaking the model is allowed. Encouraged, even.']
    ] },
    'lin-zone': { title: 'Road Lab', lines: [
      ['ori', 'What if both towns have the same x? Can I still build a road between them?'],
      ['delta', 'Try it! Here, a broken model is treasure.']
    ] },
    'par-zone': { title: 'Catapult Lab', lines: [
      ['ori', 'What if a = 0? Does the arrow even fly? What if it never lands?'],
      ['delta', 'Only one way to find out. Try it carefully!']
    ] },
    'cub-zone': { title: 'River Lab', lines: [
      ['ori', 'Every river turns around somewhere. Right? Right?'],
      ['delta', 'Ask the river to find its turning points. Try different values of p.']
    ] },
    'exp-zone': { title: 'Garden Lab', lines: [
      ['ori', 'What if b = 1? Or zero? Or negative? Ooh, what if…'],
      ['delta', 'Every one is a good question. Try them all!']
    ] },
    'rat-zone': { title: 'Wall Lab', lines: [
      ['ori', 'What if I walk straight to the wall? Just one tiny step onto it?'],
      ['delta', 'That’s exactly where The Glitch came from. Be ready for anything!']
    ] },
    'zone-friendly': { title: 'The Guardian', lines: [
      ['glitch', 'Hi, Ori! Guardian of the edges, reporting for duty! Try a weird input. I’ll show you where the rules stop.']
    ] }
  };

  /** Scenes that can be replayed from the Journal, in story order. */
  var replayOrder = ['opening', 'wake', 'tileAfter', 'glimpse', 'mir-intro', 'mir-thanks', 'mapFirst', 'lin-intro', 'lin-thanks',
    'par-intro', 'par-thanks', 'cub-intro', 'cub-thanks', 'exp-intro', 'exp-thanks', 'ratUnlock', 'rat-intro', 'rat-thanks', 'bossIntro', 'finale'];

  function wordCount(text) { return String(text).replace(/̷/g, '').trim().split(/\s+/).filter(Boolean).length; }

  return { scenes: scenes, replayOrder: replayOrder, glitchText: g, wordCount: wordCount };
});
