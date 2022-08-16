import { useEffect, useReducer, useState } from 'react';

// app components
import { SeedBag } from './components/SeedBag';
import { SideMenu } from './components/SideMenu';
import { NurseryModal } from './components/NurseryModal';
import { GamePlayMapDrawing } from './components/GamePlayMapDrawing';
import { UserInfo } from './components/UserInfo';

// app logic / data
import { config, startDateSeed, treasury, txTimeout, NROWCOL } from './constants';
import { GameMap } from './logic/GameMap';
import { useKeyPress } from './hooks/useKeyPress';
import { useToggle } from './hooks/useToggle';
import { useGarden } from './hooks/useGarden';
import { useMetaplex } from './hooks/useMetaplex';
import { useTransactionHistory } from './hooks/useTransactionHistory';
import { indexToCoords } from './shared/utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import './assets/styles/App.css';

const isInt = n => n % 1 === 0;

const map = new GameMap({ userPos: [1, 1] });

function App() {
    const [followingSpot, setFollowingSpot] = useState([1, 1]);
    const [userPos, setUserPos] = useState([1, 1]);
    const [onItem, setOnItem] = useState({});
    const [direction, setDirection] = useState(1);
    const [menuWidth, setMenuWidth] = useState(0);
    const [panelClicked, setPanelClicked] = useState(null);
    const [infoModal, setInfoModal] = useState(null);

    // togglable overlays
    const [plantModal, togglePlantModal] = useToggle();
    const [nurseryModal, toggleNurseryModal] = useToggle();

    const { connection } = useConnection();
    const { wallet } = useWallet();

    const [garden, fetchGarden] = useGarden();
    const [metaplexData, fetchMetaplexData] = useMetaplex();
    const [transactionHistory, fetchTransactionHistory] = useTransactionHistory();

    const [messagesShown, setMessagesShown] = useState(null);

    const isUpPressed = useKeyPress('ArrowUp');
    const isDownPressed = useKeyPress('ArrowDown');
    const isLeftPressed = useKeyPress('ArrowLeft');
    const isRightPressed = useKeyPress('ArrowRight');
    const isPPressed = useKeyPress('p');
    const isSpaceBarPressed = useKeyPress(' ');
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    /*
       The "following" position is the space in front of user.
       Which is based on the direction they are facing
    */
    const setFollowing = () => {
        const space = 0.5;
        const [x, y] = userPos;
        if (direction === 0) {
            setFollowingSpot([x - space, y - space]);
        } else if (direction === 1) {
            setFollowingSpot([x + space, y + space]);
        } else if (direction === 2) {
            setFollowingSpot([x - space, y + space]);
        } else if (direction === 3) {
            setFollowingSpot([x + space, y - space]);
        }
    };

    /*
       Get map data when the connection or wallet changes
    */

    let operationalPubKeya = wallet && wallet.adapter && wallet.adapter.publicKey && true;

    useEffect(() => {
        if (connection && wallet) {
            fetchGarden(connection, wallet);
            fetchMetaplexData(connection, wallet);
            fetchTransactionHistory(connection, wallet);
        }
    }, [connection, wallet, operationalPubKeya]);

    /*
       Callback when [spacebar] is pressed
    */
    useEffect(() => {
        if (!isSpaceBarPressed) return;
        // console.log(followingSpot);

        let validPlantingSpot = true;
        for (let key in map.layout) {
            if (key == 'user') continue;
            for (let item of map.layout[key]) {
                if (item[0] === followingSpot[0] && item[1] === followingSpot[1]) {
                    openInfoModal([...item]);
                    validPlantingSpot = false;
                    break;
                }
            }
        }

        if (validPlantingSpot) {
            setMessagesShown(true);
            setTimeout(() => setMessagesShown(false), 3000);
        }
    }, [isSpaceBarPressed]);

    /*
       Callback when user moves
    */
    useEffect(() => {
        setFollowing();
    }, [userPos, direction]);

    /*
       Callback when [p] is pressed
    */
    useEffect(() => {
        if (isPPressed) {
            togglePlantModal();
        }
    }, [isPPressed]);

    /*
       Callback when directional key is pressed
    */
    useEffect(() => {
        let moveAMt = 0.5;
        if (isUpPressed) {
            setDirection(0);
            var [x, y] = userPos;
            map.updateUser({ userPos: [x - moveAMt, y - moveAMt] });
        }
        if (isDownPressed) {
            setDirection(1);
            var [x, y] = userPos;
            map.updateUser({ userPos: [x + moveAMt, y + moveAMt] });
        }
        if (isLeftPressed) {
            setDirection(2);
            var [x, y] = userPos;
            map.updateUser({ userPos: [x - moveAMt, y + moveAMt] });
        }
        if (isRightPressed) {
            setDirection(3);
            var [x, y] = userPos;
            map.updateUser({ userPos: [x + moveAMt, y - moveAMt] });
        }
        setUserPos(map.layout.user[0]);
    }, [isUpPressed, isDownPressed, isLeftPressed, isRightPressed]);

    useEffect(() => {
        if (isInt(userPos[0]) && isInt(userPos[1])) {
            let item = { name: 'none' };
            setOnItem(item);
        } else {
            setOnItem(null);
        }
    }, [userPos]);

    /*
       Callback when map data is updated
    */
    useEffect(() => {
        // exit we dont have data
        if (!garden || !transactionHistory || metaplexData.length === 0) return;

        const lookup = {
            '2UsB4iZNrGmLA7v9Z7ry5E7svTYSmNgQMWwnctxRLv83': 'Wild willow #357',
            FfSUmPyLrEDgrP8u5c9ZKbMDd9pRzB6ieSJsLH2ommV5: 'Deep blue #104',
        };

        // nftdata map 1:1 with image type
        const nftdata = Object.values(metaplexData).reduce((occ, a) => {
            const newObj = a.reduce((acc, x) => {
                const key = x.mint.address.toBase58();
                const value = x.json;
                return { ...acc, [key]: value };
            }, {});

            return { ...occ, ...newObj };
        }, {});

        // parse results and store in array
        let results = [];
        for (let i = 0; i < garden.grid.length; i++) {
            let key = garden.grid[i].toString();
            if (key == '11111111111111111111111111111111') continue;

            let encodedPos = garden.positions[i];

            // decode single digit into location on floor
            const [x, y] = indexToCoords({
                index: encodedPos,
                w: NROWCOL + 1,
            });

            results.push({
                location: [x, y],
                attrs: nftdata[key],
                plantTime: transactionHistory[key],
                index: encodedPos,
                name: lookup[key],
                key,
            });
        }

        console.log('results', results);

        // TODO: fix hacky deep copy for map updating
        const newLayout = JSON.parse(JSON.stringify(map.layout));
        for (let item of results) {
            switch (item.key) {
                default:
                    newLayout['myitem'].push(item.location);
                // code block
            }
        }

        const nftData = {};

        for (let r of results) {
            if (!nftData[r.index]) nftData[r.index] = r;
        }

        map.forceResetNftData(nftData);
        map.forceResetLayout(newLayout);
        forceUpdate();
    }, [garden, metaplexData]);

    /*
       Callback when any square on the floor is pressed
    */
    const onPanelClicked = panel => {
        setPanelClicked(panel);
    };

    /*
       Callback when specific plant is clicked 
    */
    const openInfoModal = coords => {
        setInfoModal(!infoModal);
    };

    return (
        <div className="App">
            {/* options to drive menus */}
            <SideMenu openNurseryModal={toggleNurseryModal} openPlantModal={togglePlantModal} />

            {/* the sun */}
            <img src={'sprites/back.png'} className="sun" />

            {/* header for sharing */}
            <h1>grdn.day</h1>

            {/* overlay for aquiring new seeds */}
            {nurseryModal && (
                <NurseryModal
                    config={config}
                    startDateSeed={startDateSeed}
                    treasury={treasury}
                    txTimeout={txTimeout}
                />
            )}

            {/* users existing seeds */}
            {plantModal && <SeedBag followingSpot={followingSpot} />}

            {/*  the actual game map */}
            <GamePlayMapDrawing
                map={map}
                nRowCol={NROWCOL}
                onPanelClicked={onPanelClicked}
                direction={direction}
                openInfoModal={openInfoModal}
                messagesShown={messagesShown}
                menuWidth={menuWidth}
                infoModal={infoModal}
            />

            {/* footer user info */}
            <UserInfo />
        </div>
    );
}

export default App;
