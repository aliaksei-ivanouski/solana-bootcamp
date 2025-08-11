import { useWalletUi } from '@wallet-ui/react'
import type { Instruction, TransactionSendingSigner } from 'gill'
import { createTransaction, getBase58Decoder, signAndSendTransactionMessageWithSigners } from 'gill'

export function useWalletTransactionSignAndSend() {
  const { client, wallet } = useWalletUi()

  return async (ix: Instruction | Instruction[], signer: TransactionSendingSigner) => {
    try {
      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

      const transaction = createTransaction({
        feePayer: signer,
        version: 0,
        latestBlockhash,
        instructions: Array.isArray(ix) ? ix : [ix],
      })

      // Validate transaction structure
      if (!transaction.feePayer) {
        throw new Error('Transaction missing feePayer')
      }
      if (!transaction.instructions || transaction.instructions.length === 0) {
        throw new Error('Transaction missing instructions')
      }
      if (!latestBlockhash) {
        throw new Error('Latest blockhash is missing')
      }

      const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
      const signature = getBase58Decoder().decode(signatureBytes)

      return signature
    } catch (error) {
      console.error('Error in useWalletTransactionSignAndSend:', error)
      throw error
    }
  }
}
