// sprites
import { ReactComponent as FoxFront } from '../assets/sprites/fox_front.svg';
import { ReactComponent as FoxBack } from '../assets/sprites/fox_back.svg';
import { ReactComponent as FoxLeft } from '../assets/sprites/fox_left.svg';
import { ReactComponent as FoxRight } from '../assets/sprites/fox_right.svg';
import { ReactComponent as FoxWaterLeft } from '../assets/sprites/fox_water_left.svg';
import { ReactComponent as CherryBlossomAdult } from '../assets/sprites/cherry_blossom_adult.svg';
import { ReactComponent as CherryBlossomOld } from '../assets/sprites/cherry_blossom_old.svg';

import { ReactComponent as CherryBlossomSeedling } from '../assets/sprites/cherryblossom/seedling.svg';
import { ReactComponent as CherryBlossomYoung } from '../assets/sprites/cherryblossom/young.svg';
// import { ReactComponent as CherryBlossomAdult } from '../assets/sprites/cherryblossom/adult.svg';
import { ReactComponent as CherryBlossomElder } from '../assets/sprites/cherryblossom/elder.svg';

import Seed from '../assets/sprites/seed.svg';

const SQUARE_SIZE = 360;
const NROWCOL = 7;
const FOX_SIZE = 340;

export class GameMap {
    // width = 50;

    layout = {
        sunflower: [],
        trees: [],
        plants: [],
        candy: [],
        myitem: [],
        treeOld: [],
        user: [[1, 1]],
    };

    // store data in map
    nftData = {};

    imagePath = {
        myitem: {
            seedling: <CherryBlossomSeedling width="400" />,
            young: <CherryBlossomYoung width="400" />,
            adult: <CherryBlossomAdult width="400" />,
            elder: <CherryBlossomElder width="400" />,
        },
        treeOld: <CherryBlossomOld width="460" />,
        trees: 'sprites/tree_3.png',
        plants: 'sprites/plant.png',
        sunflower: 'sprites/fxemoji_sunflower.png',
        candy: 'sprites/candym.png',
        user: {
            0: <FoxBack width={FOX_SIZE} />,
            1: <FoxFront width={FOX_SIZE} />,
            2: <FoxLeft width={FOX_SIZE} />,
            3: <FoxRight width={FOX_SIZE} />,
        },
    };

    foreground = {};

    alreadySorted = false;
    sortedItems;

    forceResetLayout = layout => {
        this.layout = JSON.parse(JSON.stringify(layout));
    };

    forceResetNftData = data => {
        this.nftData = JSON.parse(JSON.stringify(data));
    };

    updateUser = ({ userPos }) => {
        const limit = NROWCOL;
        // dont allow off map
        if (userPos[0] > limit || userPos[1] > limit || userPos[0] < 0 || userPos[1] < 0) return;

        // dont allow on item
        let inRow = this.foreground[userPos[0] + userPos[1]];
        let touch = inRow && inRow.filter(([x, y, _]) => x === userPos[0] && y === userPos[1]);
        if (touch && touch.length > 0) return;

        this.layout.user = [userPos];
    };

    addTree = ({ tree }) => {
        const limit = 7;
        // dont allow off map
        if (tree[0] > limit || tree[1] > limit || tree[0] < 0 || tree[1] < 0) return;

        // dont allow on item
        let inRow = this.foreground[tree[0] + tree[1]];
        let touch = inRow && inRow.filter(([x, y, _]) => x === tree[0] && y === tree[1]);
        if (touch && touch.length > 0) return;

        this.layout.trees = [...this.layout.trees, tree];
    };

    addToLayout = ({ item, coords }) => {
        this.layout[item].push(coords);
    };

    adjustors = {
        trees: (x, y) => [x, y],
        treeOld: (x, y) => [x - SQUARE_SIZE / 3, y - 40 - window.innerHeight / 2],
        plants: (x, y) => [x, y - 40],
        text: (x, y) => [x + 30, y + 30],
        user: (x, y) => [x - SQUARE_SIZE / 6, y - window.innerHeight / 2 + SQUARE_SIZE / 6],
        sunflower: (x, y) => [x - 0, y - 70],
        candy: (x, y) => [x - 0, y - 120],
        myitem: (x, y) => [x - SQUARE_SIZE / 4, y - 40 - window.innerHeight / 2 + 40],
    };

    getGridCoords = (row, col) => {
        let k = 48;
        let scale = 29 / 50;
        let j = scale * k;
        let x = row * k + k * (5 - col) + 120;
        let y = row * j + j * col + 140;
        return [x, y];
    };

    getGridCoords2 = (row, col) => {
        let s = 1;
        let sq = SQUARE_SIZE * s;
        let scale = 29 / 50;
        let k = (sq * scale) / 2.06;
        let x = row * k + k * -col + window.innerWidth * 0.415;
        let y = row * scale * k + scale * k * col + window.innerHeight / 6;
        return [x, y];
    };

    getGridInfo = (row, col) => {
        let s = 1;
        let sq = SQUARE_SIZE * s;
        let vba = 1.8 * sq;
        let scale = 29 / 50;
        let m = scale * sq;
        return [m, sq, vba];
    };

    getSortedItems = () => {
        this.foreground = {};

        let items = Object.keys(this.layout).flatMap(itemType => {
            return this.layout[itemType].map(coords => {
                var [x, y] = coords;

                let sum = x + y;
                if (this.foreground[sum] === undefined) this.foreground[sum] = [];
                this.foreground[sum].push([x, y, itemType]);

                return [x, y, itemType];
            });
        });

        items = Object.keys(this.foreground).flatMap(row => {
            return this.foreground[row].map(([a, b, itemType]) => {
                let [x, y] = this.adjustors[itemType](...this.getGridCoords2(a, b));
                return [x, y, itemType, a, b];
            });
        });

        return items;
    };
}
