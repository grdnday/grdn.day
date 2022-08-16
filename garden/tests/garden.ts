import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Garden } from "../target/types/garden";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  Connection,
  Commitment,
} from "@solana/web3.js";
import { assert } from "chai";

describe("garden", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Garden as Program<Garden>;

  let mintA: PublicKey = null;
  let mintB: PublicKey = null;
  let initializerTokenAccountA: PublicKey = null;
  let initializerTokenAccountB: PublicKey = null;
  let takerTokenAccountA: PublicKey = null;
  let takerTokenAccountB: PublicKey = null;
  let vault_account_pda = null;
  let vault_account_bump = null;
  let vault_authority_pda = null;

  const takerAmount = 1;
  const initializerAmount = 1;

  const gardenAccount = anchor.web3.Keypair.generate();
  const payer = anchor.web3.Keypair.generate();
  const mintAuthority = anchor.web3.Keypair.generate();
  const initializerMainAccount = anchor.web3.Keypair.generate();

  const printData = async () => {
    {
      let ta = await getAccount(
        provider.connection, // connection
        initializerTokenAccountA // address
      );
      console.log({
        ...ta,
      });

      let tb = await getAccount(
        provider.connection, // connection
        initializerTokenAccountB // address
      );
      console.log({
        ...tb,
      });
    }
  };

  it("Setup accounts and mints", async () => {
    // Airdropping tokens to a payer.
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 1000000000),
      "processed"
    );

    // Fund Main Accounts
    await provider.connection.sendTransaction(
      (() => {
        const tx = new Transaction();
        tx.add(
          SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: initializerMainAccount.publicKey,
            lamports: 100000000,
          })
        );
        return tx;
      })(),
      [payer]
    );

    mintA = await createMint(
      provider.connection, // connection
      payer, // payer
      mintAuthority.publicKey, // mint authority
      null, // freeze authority
      0 // decimals
    );

    mintB = await createMint(
      provider.connection, // connection
      payer, // payer
      mintAuthority.publicKey, // mint authority
      null, // freeze authority
      0 // decimals
    );

    console.log("Created Mints");
    console.log("Mint A", mintA.toString());
    console.log("Mint B", mintB.toString());

    initializerTokenAccountA = await createAccount(
      provider.connection, // connection
      payer, // payer
      mintA, // mint
      initializerMainAccount.publicKey // owner
    );

    initializerTokenAccountB = await createAccount(
      provider.connection,
      payer,
      mintB,
      initializerMainAccount.publicKey
    );

    console.log("Created Accounts");
    console.log("Alice - A", initializerTokenAccountA.toString());
    console.log("Alice - B", initializerTokenAccountB.toString());

    await mintTo(
      provider.connection, // connection
      payer, // payer
      mintA, // mint
      initializerTokenAccountA, // destination
      mintAuthority.publicKey, // authority
      1, // amount
      [mintAuthority] // multiSigners
    );

    await mintTo(
      provider.connection, // connection
      payer, // payer
      mintB, // mint
      initializerTokenAccountB, // destination
      mintAuthority.publicKey, // authority
      1, // amount
      [mintAuthority] // multiSigners
    );

    await printData();
  });

  it("Initialize and plant", async () => {
    const [_vault_account_pda, _vault_account_bump] =
      await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("token-seed")),
          mintA.toBuffer(),
        ],
        program.programId
      );
    vault_account_pda = _vault_account_pda;
    vault_account_bump = _vault_account_bump;
    console.log("About to plant");

    await program.rpc.initialize(vault_account_bump, 35, {
      accounts: {
        initializer: initializerMainAccount.publicKey,
        vaultAccount: vault_account_pda,
        mint: mintA,
        initializerDepositTokenAccount: initializerTokenAccountA,
        gardenAccount: gardenAccount.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [
        await program.account.gardenAccount.createInstruction(gardenAccount),
      ],
      signers: [gardenAccount, initializerMainAccount],
    });

    console.log("Done initalizing");

    let _vault = await getAccount(
      provider.connection, // connection
      vault_account_pda // address
    );

    console.log({
      ..._vault,
    });

    let _gardenAccount = await program.account.gardenAccount.fetch(
      gardenAccount.publicKey
    );

    console.log("Data Account");

    console.log({
      ..._gardenAccount,
    });
    console.log("--------");

    await printData();

    console.log("start second");
    {
      const [_vault_account_pda, _vault_account_bump] =
        await PublicKey.findProgramAddress(
          [
            Buffer.from(anchor.utils.bytes.utf8.encode("token-seed")),
            mintB.toBuffer(),
          ],
          program.programId
        );
      vault_account_pda = _vault_account_pda;
      vault_account_bump = _vault_account_bump;

      console.log("About to plant");

      await program.rpc.plant(vault_account_bump, 34, {
        accounts: {
          initializer: initializerMainAccount.publicKey,
          vaultAccount: vault_account_pda,
          mint: mintB,
          initializerDepositTokenAccount: initializerTokenAccountB,
          gardenAccount: gardenAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [initializerMainAccount],
      });

      console.log("Done initalizing");

      let _vault = await getAccount(
        provider.connection, // connection
        vault_account_pda // address
      );

      console.log({
        ..._vault,
      });

      let _gardenAccount = await program.account.gardenAccount.fetch(
        gardenAccount.publicKey
      );

      console.log("Data Account");

      console.log({
        ..._gardenAccount,
      });
      console.log("--------");

      await printData();
    }
  });
});

