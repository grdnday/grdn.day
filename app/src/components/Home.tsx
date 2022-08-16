import { useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import * as anchor from '@project-serum/anchor';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Seed from './seed.svg';

import {
    createAccountsForMint,
    CandyMachineAccount,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintOneToken,
    shortenAddress,
} from '../logic/candy/candy-machine';

import { Metaplex } from '@metaplex-foundation/js';

export interface HomeProps {
    candyMachineId: anchor.web3.PublicKey;
    config: anchor.web3.PublicKey;
    name: string;
    imgBackgroundColor: string;
    startDate: number;
    treasury: anchor.web3.PublicKey;
    txTimeout: number;
}

var stringToColour = function (str) {
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

const Home = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [isActive, setIsActive] = useState(false); // true when countdown completes
    const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

    const [itemsAvailable, setItemsAvailable] = useState(0);
    const [itemsRedeemed, setItemsRedeemed] = useState(0);
    const [itemsRemaining, setItemsRemaining] = useState(0);

    const [mintNft, setMintNft] = useState<any | null>(null);

    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: '',
        severity: undefined,
    });

    const [startDate, setStartDate] = useState(new Date(props.startDate));

    const wallet = useAnchorWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();

    const { connection } = useConnection();

    const refreshCandyMachineState = () => {
        (async () => {
            if (!wallet) return;

            const candyMachine = await getCandyMachineState(
                wallet as anchor.Wallet,
                props.candyMachineId,
                connection
            );

            const {
                authority,
                itemsAvailable,
                itemsRedeemed,
                itemsRemaining,
                isSoldOut,
                isActive,
                isPresale,
                isWhitelistOnly,
                goLiveDate,
                treasury,
                tokenMint,
                gatekeeper,
                endSettings,
                whitelistMintSettings,
                hiddenSettings,
                price,
                retainAuthority,
                collectionPDA,
            } = candyMachine.state;

            const mx = Metaplex.make(connection);

            const nftTask = await mx.nfts().findByMint(tokenMint!);

            const nft = await nftTask.run();

            const data = {
                ...nft,
                collection: collectionPDA,
            };

            setMintNft(data);
            setItemsAvailable(itemsAvailable);
            setItemsRemaining(itemsRemaining);
            setItemsRedeemed(itemsRedeemed);

            setIsSoldOut(itemsRemaining === 0);
            setStartDate(new Date(Number(goLiveDate.toString())));
            setCandyMachine(candyMachine);
        })();
    };

    const onMint = async () => {
        try {
            setIsMinting(true);
            if (wallet && candyMachine?.program) {
                // check if account already exists
                // we dont want 2 I think
                const setupMint = await createAccountsForMint(
                    connection,
                    candyMachine,
                    wallet.publicKey
                );

                let status: any = { err: true };
                if (setupMint.transaction) {
                    status = await awaitTransactionSignatureConfirmation(
                        setupMint.transaction,
                        props.txTimeout,
                        connection,
                        true
                    );
                }

                const setupState = setupMint;
                const mint = setupState?.mint ?? anchor.web3.Keypair.generate();
                let mintResult = await mintOneToken(
                    connection,
                    candyMachine,
                    wallet.publicKey,
                    mint,
                    [],
                    [],
                    setupState
                );

                if (!status) {
                    setAlertState({
                        open: true,
                        message: 'Congratulations! Mint succeeded!',
                        severity: 'success',
                    });
                } else {
                    setAlertState({
                        open: true,
                        message: 'Mint failed! Please try again!',
                        severity: 'error',
                    });
                }
            }
        } catch (error: any) {
            let message = error.msg || 'Minting failed! Please try again!';
            if (!error.msg) {
                if (error.message.indexOf('0x138')) {
                } else if (error.message.indexOf('0x137')) {
                    message = `SOLD OUT!`;
                } else if (error.message.indexOf('0x135')) {
                    message = `Insufficient funds to mint. Please fund your wallet.`;
                }
            } else {
                if (error.code === 311) {
                    message = `SOLD OUT!`;
                    setIsSoldOut(true);
                } else if (error.code === 312) {
                    message = `Minting period hasn't started yet.`;
                }
            }

            setAlertState({
                open: true,
                message,
                severity: 'error',
            });
        } finally {
            if (wallet) {
                const balance = await connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
            setIsMinting(false);
            refreshCandyMachineState();
        }
    };

    useEffect(() => {
        (async () => {
            if (wallet) {
                const balance = await connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [wallet, connection]);

    useEffect(refreshCandyMachineState, [wallet, props.candyMachineId, connection]);

    return (
        <div
            style={{
                backgroundColor: mintNft
                    ? stringToColour(mintNft.mint.address.toBase58().slice(0, 7))
                    : '#ccc',
                height: 140,
                width: 100,
                margin: 10,
                borderRadius: '20px',
                boxShadow: '0px 17px 20px -10px rgba(0, 0, 0, 0.4)',
            }}
            onClick={onMint}
        >
            <main>
                {mintNft && (
                    <>
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            {mintNft.json.name}
                        </div>
                        <img src={mintNft.json.image} width={40} />
                        <br />
                        <small>
                            {itemsRemaining} / {itemsAvailable}
                        </small>
                        <br />
                        <a
                            href={`https://www.solaneyes.com/address/${
                                candyMachine
                                    ? (candyMachine?.program as any).publicKey &&
                                      (candyMachine?.program as any).publicKey.toBase58()
                                    : '...'
                            }cluster=devnet`}
                            target="_blank"
                            style={{
                                color: 'black',
                            }}
                        >
                            <small>{'Solanaeyes'}</small>
                        </a>
                    </>
                )}

                <div>
                    <div
                        style={{
                            marginTop: 20,
                        }}
                    >
                        {alertState.message}
                    </div>
                </div>
            </main>
        </div>
    );
};

interface AlertState {
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error' | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
    return (
        <div>
            {hours + (days || 0) * 24} hours, {minutes} minutes, {seconds} seconds
        </div>
    );
};

export default Home;
