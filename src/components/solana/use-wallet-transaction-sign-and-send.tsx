import { useWalletUi } from '@wallet-ui/react'
import type { Instruction, TransactionSendingSigner } from 'gill'
import { createTransaction, getBase58Decoder, signAndSendTransactionMessageWithSigners } from 'gill'

export function useWalletTransactionSignAndSend() {
  const { client, wallet } = useWalletUi()

  return async (ix: Instruction | Instruction[], signer: TransactionSendingSigner) => {
    try {
      console.log('=== INPUT DEBUG ===')
      console.log('Instruction input:', ix)
      console.log('Instruction type:', typeof ix)
      console.log('Instruction constructor:', ix?.constructor?.name)
      console.log('Signer input:', signer)
      console.log('Signer type:', typeof signer)
      console.log('Signer constructor:', signer?.constructor?.name)
      console.log('=== END INPUT DEBUG ===')

      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

      const transaction = createTransaction({
        feePayer: signer,
        version: 0,
        latestBlockhash,
        instructions: Array.isArray(ix) ? ix : [ix],
      })

      // Debug transaction creation immediately
      console.log('=== TRANSACTION CREATION DEBUG ===')
      console.log('Transaction object created:', transaction)
      console.log('Transaction type:', typeof transaction)
      console.log('Transaction constructor:', transaction.constructor.name)
      console.log('Transaction prototype:', Object.getPrototypeOf(transaction))
      console.log('Transaction keys:', Object.keys(transaction))
      console.log('Transaction values:', Object.values(transaction))
      console.log('=== END TRANSACTION CREATION DEBUG ===')

      console.log('=== TRANSACTION DEBUG ===')
      console.log('Transaction created:', transaction)
      console.log('Transaction type:', typeof transaction)
      console.log('Transaction keys:', Object.keys(transaction))
      console.log('Signer:', signer)
      console.log('Signer type:', typeof signer)
      console.log('Signer keys:', Object.keys(signer))
      console.log('Instructions:', Array.isArray(ix) ? ix : [ix])
      console.log('Latest blockhash:', latestBlockhash)
      console.log('Wallet object:', wallet)
      console.log('Wallet type:', typeof wallet)
      console.log('Wallet keys:', wallet ? Object.keys(wallet) : 'null')

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

      console.log('Transaction validation passed')
      console.log('=== END TRANSACTION DEBUG ===')

      // Log the exact transaction structure being sent to the wallet
      console.log('=== TRANSACTION STRUCTURE DEBUG ===')
      console.log('Transaction feePayer address:', transaction.feePayer.address.toString())
      console.log('Transaction instructions count:', transaction.instructions.length)
      console.log('Transaction instructions:', transaction.instructions.map((ix, i) => ({
        index: i,
        programAddress: ix.programAddress.toString(),
        accounts: ix.accounts?.map((acc, j) => ({
          index: j,
          address: acc.address.toString(),
          isSigner: 'isSigner' in acc ? acc.isSigner : 'N/A',
          isWritable: 'isWritable' in acc ? acc.isWritable : 'N/A',
        })) || 'No accounts',
        data: ix.data ? `0x${Buffer.from(ix.data).toString('hex')}` : 'null'
      })))
      console.log('Transaction version:', transaction.version)
      console.log('Transaction lifetimeConstraint:', transaction.lifetimeConstraint)
      console.log('=== END TRANSACTION STRUCTURE DEBUG ===')

      // Use the working pattern from the examples - this should work the same way
      console.log('About to call signAndSendTransactionMessageWithSigners...')
      const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
      console.log('signAndSendTransactionMessageWithSigners completed successfully')
      const signature = getBase58Decoder().decode(signatureBytes)

      console.log('Transaction signature:', signature)
      return signature
    } catch (error) {
      console.error('Error in useWalletTransactionSignAndSend:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      })
      throw error
    }
  }
}
