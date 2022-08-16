import * as anchor from '@project-serum/anchor';
import React from 'react';
import { GARDEN_PROGRAM } from '../constants';

export function useTransactionHistory(initialValue: any) {
    const [garden, setValue] = React.useState(initialValue);
    const fetchGarden = React.useCallback(async (connection, wallet, makeCall) => {
        const options = { limit: 10 };
        const history = await connection.getConfirmedSignaturesForAddress2(GARDEN_PROGRAM, options);

        const plantingTimes = {};
        for (let hist of history) {
            const sig = hist.signature;
            let valu = JSON.parse(window.localStorage.getItem(sig));
            let value;
            if (!valu) {
                const options: any = { encoding: 'jsonParsed' };
                const tx = await connection.getConfirmedTransaction(sig, 'confirmed', options);
                value = { hist, tx };
                window.localStorage.setItem(sig, JSON.stringify(value));
            } else {
                value = valu;
            }
            // parse all keys from info
            let keys = value.tx.transaction.instructions[0].keys;
            if (keys.length == 8) {
                plantingTimes[keys[1].pubkey] = value.tx.blockTime;
            }
        }

        setValue(plantingTimes);
    }, []);
    return [garden, fetchGarden];
}
