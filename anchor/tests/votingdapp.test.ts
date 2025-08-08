import anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Votingdapp } from '../target/types/votingdapp';
import { describe, it, expect, beforeAll } from 'vitest';
import BN from 'bn.js';

describe('votingdapp', () => {

  const poll_id = new BN(Date.now());
  let program: Program<Votingdapp>;

  beforeAll(async () => {
    process.chdir('./anchor');
    anchor.setProvider(anchor.AnchorProvider.env());
    program = anchor.workspace.Votingdapp as Program<Votingdapp>;
  })

  it('Initialize Poll', async () => {
    await program.methods.initializePoll(
      poll_id,
      "What is your favourite pinut butter?",
      new BN(0),
      new BN(1854222157),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [poll_id.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );

    const poll = await program.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toBe(poll_id.toNumber());
    expect(poll.description).toBe("What is your favourite pinut butter?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
    expect(poll.pollStart.toNumber()).toBe(0);
    expect(poll.pollEnd.toNumber()).toBe(1854222157);
    expect(poll.candidateAmount.toNumber()).toBe(0);
  })

  it('Initialize Candidate', async () => {
    await program.methods.initializeCandidate(
      "Crunchy",
      poll_id,
    ).rpc();

    await program.methods.initializeCandidate(
      "Smooth",
      poll_id,
    ).rpc();


    const [CrunchyAddress] = PublicKey.findProgramAddressSync(
      [poll_id.toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      program.programId
    );

    const Crunchy = await program.account.candidate.fetch(CrunchyAddress);
    console.log(Crunchy);

    expect(Crunchy.candidateName).toBe("Crunchy");
    expect(Crunchy.candidateVotes.toNumber()).toBe(0);

    const [SmoothAddress] = PublicKey.findProgramAddressSync(
      [poll_id.toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      program.programId
    );

    const Smooth = await program.account.candidate.fetch(SmoothAddress);
    console.log(Smooth);

    expect(Smooth.candidateName).toBe("Smooth");
    expect(Smooth.candidateVotes.toNumber()).toBe(0);

    expect(Crunchy.candidateName).not.toBe(Smooth.candidateName);
  })

  it('Vote', async () => {
    await program.methods.vote(
      "Crunchy",
      poll_id,
    ).rpc();

    const [CrunchyAddress] = PublicKey.findProgramAddressSync(
      [poll_id.toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      program.programId
    );

    const Crunchy = await program.account.candidate.fetch(CrunchyAddress);
    console.log(Crunchy);

    const [SmoothAddress] = PublicKey.findProgramAddressSync(
      [poll_id.toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      program.programId
    );

    const Smooth = await program.account.candidate.fetch(SmoothAddress);
    console.log(Smooth);

    expect(Crunchy.candidateVotes.toNumber()).toBe(1);
    expect(Smooth.candidateVotes.toNumber()).toBe(0);
  })
})
