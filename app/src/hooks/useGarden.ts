import * as anchor from '@project-serum/anchor';
import React from 'react';
import { GARDEN_PROGRAM } from '../constants';

export function useGarden(initialValue: any) {
    const [garden, setValue] = React.useState(initialValue);
    const fetchGarden = React.useCallback(async (connection, wallet) => {
        const gardenAccountPublicKey = new anchor.web3.PublicKey(
            'HzHGW3D2Fq5r9J65Ca4wpYFH4p1qVDSeKTD2aj7Ni7Qt'
        );

        // Create your Anchor Provider that rejects when it signs anything.
        const provider = new anchor.Provider(connection, wallet, {
            preflightCommitment: 'processed',
        });

        const idl = await anchor.Program.fetchIdl(GARDEN_PROGRAM, provider);

        const program = new anchor.Program(idl, GARDEN_PROGRAM, provider);

        let gardenAccount = await program.account.gardenAccount.fetch(gardenAccountPublicKey);

        setValue(gardenAccount);
    }, []);
    return [garden, fetchGarden];
}
