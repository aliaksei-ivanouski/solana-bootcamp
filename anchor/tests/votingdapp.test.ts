import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Votingdapp } from '../target/types/votingdapp';
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { describe, it, expect } from 'vitest';
import IDL from '../target/idl/votingdapp.json' assert { type: 'json' };
import BN from 'bn.js';

const votingdappAddress = new PublicKey("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H")

describe('votingdapp', () => {

  it('Initialize Poll', async () => {
    const context = await startAnchor("./anchor", [{
      name: "votingdapp",
      programId: votingdappAddress
    }], []);
    const provider = new BankrunProvider(context);
    const program = new Program<Votingdapp>(
      IDL,
      provider,
    );

    await program.methods.initializePoll(
      new BN(1),
      "What is your favourite pinut butter?",
      new BN(0),
      new BN(1854222157),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8)],
      votingdappAddress
    );

    const poll = await program.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toBe(1);
    expect(poll.description).toBe("What is your favourite pinut butter?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
    expect(poll.pollStart.toNumber()).toBe(0);
    expect(poll.pollEnd.toNumber()).toBe(1854222157);
    expect(poll.candidateAmount.toNumber()).toBe(0);
  })
})
