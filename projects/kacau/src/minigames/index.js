// Mini-game registry. To add a game: create src/minigames/<id>.js, import it here, add its
// strings to data/lang/en.json (+ id.json) under "mg.<id>". See docs/ADDING_A_MINIGAME.md.
import sumo from './sumo.js';
import quickdraw from './quickdraw.js';
import noodle from './noodle.js';
import sack from './sack.js';
import kerupuk from './kerupuk.js';
import potato from './potato.js';
import colorsnap from './colorsnap.js';
import tug from './tug.js';
import sweeper from './sweeper.js';
import hoops from './hoops.js';

export const MINIGAMES = [sumo, quickdraw, noodle, sack, kerupuk, potato, colorsnap, tug, sweeper, hoops];
export const getGame = (id) => MINIGAMES.find((m) => m.id === id);
