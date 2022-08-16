export const stringToColour = function (str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xff;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
};

export const coordsToIndex = ({ x, y, w }: any) => {
    const index = x * w + y;
    return index;
};
export const indexToCoords = ({ index, w }: any) => {
    const x = Math.floor(index / w);
    const y = index % w;
    return [x, y];
};
