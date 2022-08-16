import {GiPlantSeed} from 'react-icons/gi';
import {AiFillShop} from 'react-icons/ai';
import {FaGlobeAmericas} from 'react-icons/fa';
import {MdBackpack} from 'react-icons/md';

const style = {
    borderRadius: '100%',
    position: 'absolute',
    left: 20,
    backgroundColor: '#512da8',
    height: 50,
    width: 50,
    lineHeight: '50px',
    fontFamily: '"Comfortaa", cursive !important',
    fontSize: 16,
    fontWeight: 600,
    boxShadow: '0px 17px 20px -10px rgba(0, 0, 0, 0.4)',
    transition: 'all ease-in-out 300ms',
    color: '#fff',
};

export const SideMenu = ({ openNurseryModal, openPlantModal }) => {
    return (
        <>
            <div className="hover-effect" style={{ ...style, top: '7vh', backgroundColor: "#333" }}>
                <div><AiFillShop/></div>
            </div>
            <div
                className="hover-effect"
                style={{ ...style, top: '12.5vh' }}
                onClick={openNurseryModal}
            >
                <div><GiPlantSeed/></div>
            </div>
            <div className="hover-effect" style={{ ...style, top: '18vh', backgroundColor: "#333" }}>
                <div><FaGlobeAmericas/></div>
            </div>
            <div
                className="hover-effect"
                style={{ ...style, top: '23.5vh' }}
                onClick={openPlantModal}
            >
                <div><MdBackpack/></div>
            </div>
        </>
    );
};
