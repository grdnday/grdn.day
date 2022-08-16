import { candyMachines } from '../constants';
import Home from './Home';

export const NurseryModal = ({ config, startDateSeed, treasury, txTimeout }) => {
    return (
        <div
            style={{
                position: 'absolute',
                backgroundColor: '#faf0e6',
                height: 200,
                width: 880,
                left: 'calc((100% - 880px)/2)',
                borderRadius: '30px',
                display: 'flex',
                flexWrap: 'wrap',
                overflow: 'scroll',
                alignContent: 'flex-start',
            }}
        >
            {candyMachines.map(machine => {
                return (
                    <Home
                        candyMachineId={machine}
                        config={config}
                        name={machine}
                        // connection={connection}
                        startDate={startDateSeed}
                        treasury={treasury}
                        txTimeout={txTimeout}
                    />
                );
            })}
        </div>
    );
};
