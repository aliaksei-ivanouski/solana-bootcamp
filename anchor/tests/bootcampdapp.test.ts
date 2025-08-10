import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  isSolanaError,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchBootcampdapp,
  getCloseInstruction,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '../src'
// @ts-ignore error TS2307 suggest setting `moduleResolution` but this is already configured
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('bootcampdapp', () => {
  let payer: KeyPairSigner
  let bootcampdapp: KeyPairSigner

  beforeAll(async () => {
    bootcampdapp = await generateKeyPairSigner()
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize Bootcampdapp', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getInitializeInstruction({ payer: payer, bootcampdapp: bootcampdapp })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSER
    const currentBootcampdapp = await fetchBootcampdapp(rpc, bootcampdapp.address)
    expect(currentBootcampdapp.data.count).toEqual(0)
  })

  it('Increment Bootcampdapp', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({
      bootcampdapp: bootcampdapp.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchBootcampdapp(rpc, bootcampdapp.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Increment Bootcampdapp Again', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({ bootcampdapp: bootcampdapp.address })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchBootcampdapp(rpc, bootcampdapp.address)
    expect(currentCount.data.count).toEqual(2)
  })

  it('Decrement Bootcampdapp', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getDecrementInstruction({
      bootcampdapp: bootcampdapp.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchBootcampdapp(rpc, bootcampdapp.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Set bootcampdapp value', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getSetInstruction({ bootcampdapp: bootcampdapp.address, value: 42 })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchBootcampdapp(rpc, bootcampdapp.address)
    expect(currentCount.data.count).toEqual(42)
  })

  it('Set close the bootcampdapp account', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getCloseInstruction({
      payer: payer,
      bootcampdapp: bootcampdapp.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    try {
      await fetchBootcampdapp(rpc, bootcampdapp.address)
    } catch (e) {
      if (!isSolanaError(e)) {
        throw new Error(`Unexpected error: ${e}`)
      }
      expect(e.message).toEqual(`Account not found at address: ${bootcampdapp.address}`)
    }
  })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction)
}
