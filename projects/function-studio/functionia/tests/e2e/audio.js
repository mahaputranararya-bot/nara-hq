/* Functionia — audio check (dev tool; needs Playwright). A headless browser can't listen, so this renders
 * every music theme and the sound-effects reel offline (OfflineAudioContext), checks none is silent and
 * none clips (peak < 1.0), and saves WAV previews.  Usage: node tests/e2e/audio.js [outDir] [seconds] */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const out = process.argv[2] || path.join(__dirname, 'audio');
const SECONDS = parseFloat(process.argv[3] || '16');
fs.mkdirSync(out, { recursive: true });

function wav(samples, rate) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), 44 + i * 2));
  return buf;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../../index.html'));
  await p.waitForTimeout(300);
  const names = (await p.evaluate(() => F.Audio.themes())).concat(['sfx']);
  let bad = 0;
  for (const name of names) {
    const secs = name === 'sfx' ? 26 : SECONDS;
    const r = await p.evaluate(async ([name, secs]) => {
      const buf = await F.Audio.render(name, secs);
      const L = buf.getChannelData(0), R = buf.getChannelData(1);
      let peak = 0, sum = 0;
      const step = 2, mono = [];
      for (let i = 0; i < L.length; i++) { const v = (L[i] + R[i]) / 2; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); sum += v * v; if (i % step === 0) mono.push(v); }
      return { peak, rms: Math.sqrt(sum / L.length), rate: buf.sampleRate / step, mono };
    }, [name, secs]);
    const ok = r.peak < 1.0 && r.rms > 0.005;
    if (!ok) bad++;
    console.log(`${name.padEnd(7)} peak ${r.peak.toFixed(3)}  rms ${r.rms.toFixed(4)}  ${ok ? 'ok' : 'PROBLEM'}`);
    fs.writeFileSync(path.join(out, name + '.wav'), wav(r.mono, r.rate));
  }
  await b.close();
  console.log(errs.length ? 'ERRORS: ' + errs.join('\n') : (bad ? bad + ' problem(s)' : 'all themes audible, none clip'));
  process.exit(errs.length || bad ? 1 : 0);
})();
