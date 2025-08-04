import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Votingdapp } from '../target/types/votingdapp';
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { describe, it, expect, beforeAll } from 'vitest';
import IDL from '../target/idl/votingdapp.json' assert { type: 'json' };
import BN from 'bn.js';

const votingdappAddress = new PublicKey("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H")

describe('votingdapp', () => {

  let context: Context;
  let provider: BankrunProvider;
  let program: Program<Votingdapp>;

  beforeAll(async () => {
    context = await startAnchor("./anchor", [{
      name: "votingdapp",
      programId: votingdappAddress
    }], []);
    provider = new BankrunProvider(context);
    program = new Program<Votingdapp>(
      IDL,
      provider,
    );
  })

  it('Initialize Poll', async () => {
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

  it('Initialize Candidate', async () => {
    await program.methods.initializeCandidate(
      "John Doe",
      new BN(1),
    ).rpc();

    await program.methods.initializeCandidate(
      "Jane Smith",
      new BN(1),
    ).rpc();


    const [JohnDoeAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("John Doe")],
      votingdappAddress
    );

    const JohnDoe = await program.account.candidate.fetch(JohnDoeAddress);
    console.log(JohnDoe);

    expect(JohnDoe.candidateName).toBe("John Doe");
    expect(JohnDoe.candidateVotes.toNumber()).toBe(0);

    const [JaneSmithAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Jane Smith")],
      votingdappAddress
    );

    const JaneSmith = await program.account.candidate.fetch(JaneSmithAddress);
    console.log(JaneSmith);

    expect(JaneSmith.candidateName).toBe("Jane Smith");
    expect(JaneSmith.candidateVotes.toNumber()).toBe(0);

    expect(JohnDoe.candidateName).not.toBe(JaneSmith.candidateName);
  })

  it('Vote', async () => {
    await program.methods.vote(
      "John Doe",
      new BN(1),
    ).rpc();

    const [JohnDoeAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("John Doe")],
      votingdappAddress
    );

    const JohnDoe = await program.account.candidate.fetch(JohnDoeAddress);
    console.log(JohnDoe);

    const [JaneSmithAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Jane Smith")],
      votingdappAddress
    );

    const JaneSmith = await program.account.candidate.fetch(JaneSmithAddress);
    console.log(JaneSmith);

    expect(JohnDoe.candidateVotes.toNumber()).toBe(1);
    expect(JaneSmith.candidateVotes.toNumber()).toBe(0);
  })
})
