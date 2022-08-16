import React from 'react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

const getMetaplex = async (connection: any, wallet: any) => {
    if (!wallet.adapter.publicKey) return {};

    // get all of users token accounts
    const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
            {
                dataSize: 165,
            },
            {
                memcmp: {
                    offset: 32,
                    bytes: wallet.adapter.publicKey.toBase58(),
                },
            },
        ],
    });

    // try getting metaplex data for each mint
    const infos = await Promise.all(
        accounts.map(async acc => {
            try {
                const tokenAddress = new PublicKey(acc.account.data.parsed.info.mint);
                const mx = Metaplex.make(connection);
                const nftTask = await mx.nfts().findByMint(tokenAddress);
                const nft = await nftTask.run();
                return { ...nft, ...acc };
            } catch (e) {
                return null;
            }
        })
    );

    // filter failures
    const nfts = infos.filter(element => {
        return element !== null;
    });

    // aggregated into rows
    const rowed = {};
    for (let n of nfts) {
        const collection = n.collection.key.toBase58();
        if (!rowed[collection]) rowed[collection] = [];
        rowed[collection].push(n);
    }

    return rowed;
};

export const useMetaplex = () => {
    // State for keeping track of whether key is pressed
    const [metaplexData, setData] = React.useState<any>([]);
    const fetchMetaplexData = React.useCallback(async (connection, wallet) => {
        const data = await getMetaplex(connection, wallet);
        setData(data);
    }, []);
    return [metaplexData, fetchMetaplexData];
};
