import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { Metaplex } from '@metaplex-foundation/js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { stringToColour, coordsToIndex } from '../shared/utils';
import { NROWCOL, GARDEN_PROGRAM } from '../constants';

export const SeedBag = ({ followingSpot }) => {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
                filters: [
                    {
                        dataSize: 165,
                    },
                    {
                        memcmp: {
                            offset: 32,
                            bytes: wallet.publicKey.toBase58(),
                        },
                    },
                ],
            });
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

            const nfts = infos.filter(element => {
                return element !== null;
            });

            const rowed = {};
            for (let n of nfts) {
                const collection = n.collection.key.toBase58();
                if (!rowed[collection]) rowed[collection] = [];
                rowed[collection].push(n);
            }

            // [ [address, Array(2)] ]
            setItems(Object.entries(rowed));
        };
        fetchData().catch(console.error);
    }, [wallet.publicKey]);

    const initalizeGarden = async elem => {
        let vault_account_pda = null;
        let vault_account_bump = null;

        let [x, y] = followingSpot;

        const index = coordsToIndex({
            x,
            y,
            w: NROWCOL + 1,
        });

        // Create your Anchor Provider that rejects when it signs anything.
        const provider = new anchor.Provider(connection, wallet, {
            preflightCommitment: 'processed',
        });

        const idl = await anchor.Program.fetchIdl(GARDEN_PROGRAM, provider);

        const program = new anchor.Program(idl, GARDEN_PROGRAM, provider);

        const initializerMainAccount = wallet.publicKey;
        const gardenAccount = anchor.web3.Keypair.generate();

        const d = { gardenAccount: gardenAccount.publicKey.toBase58() };

        window.localStorage.setItem('gardenAccount', JSON.stringify(d));

        const mintA = elem.mint.address;
        const initializerTokenAccountA = elem.pubkey.toBase58();

        const [_vault_account_pda, _vault_account_bump] = await PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode('token-seed')), mintA.toBuffer()],
            program.programId
        );
        vault_account_pda = _vault_account_pda;
        vault_account_bump = _vault_account_bump;

        const ins = await program.account.gardenAccount.createInstruction(gardenAccount);

        const tx = await program.transaction.initialize(vault_account_bump, index, {
            accounts: {
                initializer: wallet.publicKey,
                vaultAccount: vault_account_pda,
                mint: mintA,
                initializerDepositTokenAccount: initializerTokenAccountA,
                gardenAccount: gardenAccount.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            instructions: [ins],
            signers: [gardenAccount, wallet],
        });

        tx.feePayer = wallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.sign(gardenAccount);

        const signedTx = await wallet.signTransaction(tx);

        const txId = await connection.sendRawTransaction(signedTx.serialize());

        await connection.confirmTransaction(txId);
    };

    const updateGarden = async elem => {
        let vault_account_pda = null;
        let vault_account_bump = null;

        let localGarden = JSON.parse(window.localStorage.getItem('gardenAccount'));

        if (!localGarden) return;

        localGarden = localGarden.gardenAccount;

        const gardenAccountPublicKey = new anchor.web3.PublicKey(localGarden);

        console.log('localGarden', localGarden);

        const mintAddress = elem.mint.address.toBase58();
        const tokenAccountAddress = elem.pubkey.toBase58();

        let [x, y] = followingSpot;

        const index = coordsToIndex({
            x,
            y,
            w: NROWCOL + 1,
        });

        // Create your Anchor Provider that rejects when it signs anything.
        const provider = new anchor.Provider(connection, wallet, {
            preflightCommitment: 'processed',
        });

        const idl = await anchor.Program.fetchIdl(GARDEN_PROGRAM, provider);

        const program = new anchor.Program(idl, GARDEN_PROGRAM, provider);

        let gardenAccount = await program.account.gardenAccount.fetch(gardenAccountPublicKey);

        const initializerMainAccount = wallet.publicKey;

        const mintA = new anchor.web3.PublicKey(mintAddress);

        const initializerTokenAccountA = new anchor.web3.PublicKey(tokenAccountAddress);

        const [_vault_account_pda, _vault_account_bump] = await PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode('token-seed')), mintA.toBuffer()],
            program.programId
        );
        vault_account_pda = _vault_account_pda;
        vault_account_bump = _vault_account_bump;

        const tx = await program.transaction.plant(vault_account_bump, index, {
            accounts: {
                initializer: initializerMainAccount,
                vaultAccount: vault_account_pda,
                mint: mintA,
                initializerDepositTokenAccount: initializerTokenAccountA,
                gardenAccount: gardenAccountPublicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            signers: [initializerMainAccount],
        });

        tx.feePayer = wallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signedTx = await wallet.signTransaction(tx);

        const txId = await connection.sendRawTransaction(signedTx.serialize());

        await connection.confirmTransaction(txId);
    };

    return (
        <>
            <div
                style={{
                    position: 'absolute',
                    backgroundColor: '#faf0e6',
                    height: 100,
                    width: 700,
                    left: 'calc((100% - 700px)/2)',
                    borderRadius: '100px',
                    marginTop: '20vh',
                    display: 'flex',
                    flexWrap: 'wrap',
                    overflow: 'scroll',
                }}
            >
                {items.length > 0 &&
                    items.map(([key, elements], index) => {
                        return (
                            <div key={index}>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {[...elements].map((elem, innerIndex) => {
                                        return (
                                            <div key={innerIndex}>
                                                <div
                                                    className={'item'}
                                                    onClick={async () => {
                                                        let localGarden = JSON.parse(
                                                            window.localStorage.getItem(
                                                                'gardenAccount'
                                                            )
                                                        );

                                                        if (!localGarden) {
                                                            console.log('initalizeGarden');
                                                            await initalizeGarden(elem);
                                                        } else {
                                                            console.log('updateGarden');
                                                            await updateGarden(elem);
                                                        }

                                                        // update app
                                                    }}
                                                    style={{
                                                        backgroundColor: stringToColour(
                                                            key.slice(0, 7)
                                                        ),
                                                        height: 60,
                                                        width: 60,
                                                        marginTop: 20,
                                                        marginLeft: 30,
                                                        borderRadius: '100%',
                                                        boxShadow:
                                                            '0px 17px 20px -10px rgba(0, 0, 0, 0.4)',
                                                    }}
                                                >
                                                    <img src={elem.json.image} width={60} />
                                                </div>
                                                <div className="hide">
                                                    <div className={'item-info'}>
                                                        {`${elem.account.data.parsed.info.tokenAmount.amount} ${elem.json.name}`}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </>
    );
};
