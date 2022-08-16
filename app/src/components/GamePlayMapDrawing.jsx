import { coordsToIndex, indexToCoords } from '../shared/utils';
import { NROWCOL } from '../constants';
import moment from 'moment';

const SQUARE_SIZE = 360;
const TEXT_COLOR = '#000';

export const InGameMessage = ({ toggle }) => {
    return (
        <g className={toggle ? 'intoview' : 'outofview'}>
            <rect x="20" y="100" width="340" height="40" rx="8" fill="#fff" />
            <text fontSize="1.0em" x={30} y={125} fill={TEXT_COLOR}>
                Try pressing (p) to open the plant menu
            </text>
        </g>
    );
};

const durationSince = datestr => {
    let then = new Date(datestr);
    let msec = Math.floor(Date.now() - then.getTime());
    return msec;
};

const durationSinceHuman = datestr => {
    return moment.duration(durationSince(datestr)).humanize();
};

const GameItem = ({ map, x, y, ogX, ogY, openInfoModal, itemType, direction }) => {
    const isUser = itemType == 'user';

    const index = coordsToIndex({ x: ogX, y: ogY, w: NROWCOL + 1 });
    const nftData = map.nftData[index];
    const durHuman = nftData && durationSinceHuman(nftData.plantTime * 1000);
    const dur = nftData && durationSince(nftData.plantTime * 1000);


    let size = 'seedling';

    if (dur > (6 * 60 * 60 * 1000)) {
        size = 'young';
    } 
    if (dur > (7 * 60 * 60 * 1000)) {
        size = 'adult';
    } 
    if (dur > (8 * 60 * 60 * 1000)) {
        size = 'elder';
    }

    console.log(durHuman, dur, size)
    return (
        <>
            <g key={`${x}-${y}`} transform={`translate(${[x, y]})`}>
                {isUser && <g>{map.imagePath[itemType][direction]}</g>}

                {!isUser && typeof map.imagePath[itemType][direction] === 'string' && (
                    <image
                        onClick={() => openInfoModal([x, y])}
                        width="100"
                        xlinkHref={map.imagePath[itemType]}
                    />
                )}

                {!isUser && typeof map.imagePath[itemType][direction] !== 'string' && (
                    <g>
                        {map.imagePath[itemType][size]}
                        <text transform={`translate(100, 650)`}>
                            {nftData && nftData.attrs && nftData.attrs.name}
                            {'           '}
                            {durHuman}
                            {'           '}
                            {size}
                            {'           '}
                            {nftData &&
                                nftData.attrs &&
                                durationSinceHuman(nftData.attrs.attributes[0].value)}
                        </text>
                    </g>
                )}
            </g>
        </>
    );
};

export const GamePlayMapDrawing = ({
    map,
    nRowCol,
    onPanelClicked,
    direction,
    openInfoModal,
    messagesShown,
    menuWidth,
    infoModal,
}) => {
    return (
        <svg width={'100vw'} height={'94vh'}>

            {[...Array(nRowCol + 1).keys()].map(row => {
                return [...Array(nRowCol + 1).keys()].map(col => {
                    let [x, y] = map.getGridCoords2(row, col);
                    let [m, sq, vba] = map.getGridInfo(row, col);

                    const coords = [x, y];

                    const transform = `rotate(30) skewX(-30) scale(1 .8602) translate(${m}, -${
                        m - sq * 0.15
                    })`;

                    return (
                        <g key={`${row}-${col}`} transform={`translate(${coords})`}>
                            <svg
                                onClick={() => onPanelClicked([row, col])}
                                width={m}
                                height={m}
                                viewBox={`0 0 ${vba} ${sq}`}
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    width={sq}
                                    height={sq}
                                    transform={transform}
                                    fill="white"
                                />
                                <image
                                    width={sq * 1.8}
                                    height={sq * 2}
                                    transform={`translate(-${sq * 0.02}, -${sq * 0.43})`}
                                    xlinkHref={'./sprites/fox_grass.png'}
                                />
                            </svg>
                        </g>
                    );
                });
            })}

            {/* draw grid images - storted to show correct items on top */}
            {map.getSortedItems().map(([x, y, itemType, ogX, ogY]) => {
                return (
                    <GameItem
                        map={map}
                        x={x}
                        y={y}
                        ogX={ogX}
                        ogY={ogY}
                        openInfoModal={openInfoModal}
                        itemType={itemType}
                        direction={direction}
                    />
                );
            })}

            {messagesShown !== null && <InGameMessage toggle={messagesShown} />}

            <rect x="0" width={menuWidth} height="600" rx="8" fill="#075618" />

            {infoModal && (
                <g>
                    <rect x="100" y="100" width="600" height="400" rx="8" fill="#fff" />
                    <rect
                        onClick={openInfoModal}
                        x="250"
                        y="420"
                        width="300"
                        height="60"
                        rx="8"
                        fill="#000"
                    />
                    <text x="375" y="160" fill="#000" fontSize="2em">
                        Info
                    </text>
                    <text x="160" y="200" fill="#000">
                        Type:
                    </text>{' '}
                    <text x="220" y="200" fill="#000">
                        Spruce Tree
                    </text>
                    <text x="160" y="230" fill="#000">
                        Age:
                    </text>{' '}
                    <text x="220" y="230" fill="#000">
                        7 days
                    </text>
                    <g transform={`translate(${[160, 260]})`}>
                        <image width="20" xlinkHref={'sprites/solana-sol-logo.png'} />
                    </g>
                    <text x="200" y="275" fill="#000">
                        {'9jvqHFcpX...bq1E4AJ'}
                    </text>
                    <rect x="475" y="180" width="150" height="150" rx="10" fill="#ddd" />
                    <g transform={`translate(${[500, 200]})`}>
                        <image width="100" xlinkHref={'sprites/tree.png'} />
                    </g>
                </g>
            )}
        </svg>
    );
};
