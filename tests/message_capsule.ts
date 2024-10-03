import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MessageCapsule } from "../target/types/message_capsule";

import { Clock, startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
const IDL = require("../target/idl/message_capsule.json")

process.env.RUST_LOG = 'ERROR';

const MESSAGE_CAPSULE_ID = new PublicKey(
	"84EH2DYEyYxWg7DHhL2mEoNP1r8PaDhRsRjLrsxbFYRy",
);

describe("message_capsule", () => {
  let context;
  let provider: BankrunProvider;
  let program: Program<MessageCapsule>;
  let capsuleKeyPair: Keypair;;
  
  let client;
  let payer;
  let blockhash;

  before(async () => {
    context = await startAnchor("/home/nachogutman/cf/message_capsule/", [], []);
    provider = new BankrunProvider(context);
    program = new Program<MessageCapsule>(IDL, MESSAGE_CAPSULE_ID, provider);
    
    capsuleKeyPair = Keypair.generate();

    client = context.banksClient;
	  payer = context.payer;
	  blockhash = context.lastBlockhash;
  })


  it('create message capsule', async () => { 
    const message = "Moriste en madrid";
    const tx = await program.methods
      .createCapsule(message)
      .accounts({
        capsule: capsuleKeyPair.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([capsuleKeyPair])
      .rpc();

    console.log("Your transaction signature: ", tx);
  })

  it('should not read message capsule', async () => { 
    try {
      await program.methods
        .readMessage()
        .accounts({
          capsule: capsuleKeyPair.publicKey,
        })
        .rpc();

      assert.fail();
    } catch (error){
      console.log("ERRORRRR"+ error);
    }


  })

  it('should read message capsule after time passed', async () => {
    const currentClock = await client.getClock();
    context.setClock( 
      new Clock(
        currentClock.slot,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        BigInt(60),
      )
    );

    const tx = await program.methods
      .readMessage()
      .accounts({
        capsule: capsuleKeyPair.publicKey,
      })
      .rpc();

    console.log("Your transaction signature: ", tx);
  })

});
