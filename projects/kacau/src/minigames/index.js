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
import pancake from './pancake.js';
import plane from './plane.js';
import drums from './drums.js';
import tiles from './tiles.js';
import stack from './stack.js';
import panjat from './panjat.js';
import balloon from './balloon.js';
import coconut from './coconut.js';
import holdit from './holdit.js';
import curling from './curling.js';

export const MINIGAMES = [sumo, quickdraw, noodle, sack, kerupuk, potato, colorsnap, tug, sweeper, hoops, pancake, plane, drums, tiles, stack, panjat, balloon, coconut, holdit, curling];
export const getGame = (id) => MINIGAMES.find((m) => m.id === id);
