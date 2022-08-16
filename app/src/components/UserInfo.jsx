import { useEffect, useState, FC } from 'react';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export const UserInfo: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [currentBlock, setCurrentBlock] = useState();

    useEffect(() => {
        // Using an IIFE
        (async function anyNameFunction() {
            let x = await connection.getBlockHeight();
            setCurrentBlock(x);
        })();
    }, []);

    return (
        <>
            <div
                style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    fontWeight: 600,
                    color: '#f9b856',
                }}
            >
                {connection && `Block: ${currentBlock}`}
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    fontWeight: 600,
                    color: '#f9b856',
                }}
            >
                {publicKey && `Player: ${publicKey}`}
            </div>
        </>
    );
};
