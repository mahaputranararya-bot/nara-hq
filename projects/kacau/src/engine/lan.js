// Optional LAN mode client (host side). Only active when the game is served by `npm run lan` (http://),
// never from file:// — the double-click version makes no network requests at all.
import { lanInput, lanLeave } from './input.js';

export const lan = { on: false, urls: [], pads: 0 };

export function startLan() {
  if (!/^https?:$/.test(location.protocol) || typeof WebSocket === 'undefined') return;
  let ws;
  const connect = () => {
    try { ws = new WebSocket(`ws://${location.host}/ws?role=host`); } catch (e) { return; }
    ws.onopen = () => { lan.on = true; };
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'hello') lan.urls = m.urls || [];
      else if (m.t === 'in') lanInput(m.slot, !!m.a, !!m.b);
      else if (m.t === 'bye') lanLeave(m.slot);
      else if (m.t === 'count') lan.pads = m.n;
    };
    ws.onclose = () => { lan.on = false; setTimeout(connect, 2000); };
    ws.onerror = () => {};
  };
  connect();
}
