// Mini-game registry. To add a game: create src/minigames/<id>.js, import it here, add its
// strings to data/lang/en.json (+ id.json) under "mg.<id>". See docs/ADDING_A_MINIGAME.md.
import sumo from './sumo.js';
import quickdraw from './quickdraw.js';
import noodle from './noodle.js';

export const MINIGAMES = [sumo, quickdraw, noodle];
export const getGame = (id) => MINIGAMES.find((m) => m.id === id);
