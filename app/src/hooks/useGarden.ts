import * as anchor from '@project-serum/anchor';
import React from 'react';
import { GARDEN_PROGRAM } from '../constants';

export function useGarden(initialValue: any) {
    const [garden, setValue] = React.useState(initialValue);
    const fetchGarden = React.useCallback(async (connection, wallet) => {
        let localGarden = JSON.parse(window.localStorage.getItem('gardenAccount'));

        if (!localGarden) return;

        localGarden = localGarden.gardenAccount;

        const gardenAccountPublicKey = new anchor.web3.PublicKey(localGarden);

        console.log('localGarden', localGarden);

        // Create your Anchor Provider that rejects when it signs anything.
        const provider = new anchor.Provider(connection, wallet, {
            preflightCommitment: 'processed',
        });

        const idl = await anchor.Program.fetchIdl(GARDEN_PROGRAM, provider);

        const program = new anchor.Program(idl, GARDEN_PROGRAM, provider);

        let gardenAccount = await program.account.gardenAccount.fetch(gardenAccountPublicKey);

        console.log('gardenAccount', gardenAccount);
        setValue(gardenAccount);
    }, []);
    return [garden, fetchGarden];
}
