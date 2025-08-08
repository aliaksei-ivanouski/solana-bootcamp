import anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Votingdapp } from '../target/types/votingdapp';
import { ProgramTestContext, startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { describe, it, expect, beforeAll } from 'vitest';
import IDL from '../target/idl/votingdapp.json' assert { type: 'json' };
import BN from 'bn.js';

const votingdappAddress = new PublicKey("3jMZPXYMF3Mk3PvbPpaHhkARax3PQ7DAbYhq2SY5kM7L")

describe('votingdapp', () => {

  let context: ProgramTestContext;
  let provider: BankrunProvider;
  // const provider = anchor.AnchorProvider.env();
  // anchor.setProvider(provider);
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
      "Crunchy",
      new BN(1),
    ).rpc();

    await program.methods.initializeCandidate(
      "Smooth",
      new BN(1),
    ).rpc();


    const [CrunchyAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      votingdappAddress
    );

    const Crunchy = await program.account.candidate.fetch(CrunchyAddress);
    console.log(Crunchy);

    expect(Crunchy.candidateName).toBe("Crunchy");
    expect(Crunchy.candidateVotes.toNumber()).toBe(0);

    const [SmoothAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingdappAddress
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
      new BN(1),
    ).rpc();

    const [CrunchyAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      votingdappAddress
    );

    const Crunchy = await program.account.candidate.fetch(CrunchyAddress);
    console.log(Crunchy);

    const [SmoothAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingdappAddress
    );

    const Smooth = await program.account.candidate.fetch(SmoothAddress);
    console.log(Smooth);

    expect(Crunchy.candidateVotes.toNumber()).toBe(1);
    expect(Smooth.candidateVotes.toNumber()).toBe(0);
  })
})
