import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWalletUi } from '@wallet-ui/react'
import { toast } from 'sonner'
import { toastTx } from '@/components/toast-tx'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { useWalletTransactionSignAndSend } from '@/components/solana/use-wallet-transaction-sign-and-send'
import {
  BootcampdappAccount,
  getBootcampdappProgramAccounts,
  getBootcampdappProgramId,
  getCreateJournalEntryInstruction,
  getUpdateJournalEntryInstruction,
  getDeleteJournalEntryInstruction,
} from '@project/anchor'
import {
  getProgramDerivedAddress,
  addEncoderSizePrefix,
  getUtf8Encoder,
  getU32Encoder,
  getAddressEncoder,
  type AccountMeta,
} from 'gill'
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'

export function useBootcampdappProgramId() {
  const { cluster } = useWalletUi()
  return useMemo(() => getBootcampdappProgramId(cluster.id), [cluster])
}

export function useBootcampdappProgram() {
  const { client, cluster } = useWalletUi()
  const programId = useBootcampdappProgramId()

  return useQuery({
    retry: false,
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => client.rpc.getAccountInfo(programId).send(),
  })
}

export function useBootcampdappCreateJournalEntryMutation() {
  const { cluster } = useWalletUi()
  const queryClient = useQueryClient()
  const walletSigner = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async (args: { title: string, message: string }) => {
      try {
        console.log('=== CREATE JOURNAL ENTRY DEBUG ===')
        console.log('Args:', args)
        console.log('Wallet Signer:', walletSigner)
        console.log('Wallet Signer type:', typeof walletSigner)
        console.log('Wallet Signer keys:', walletSigner ? Object.keys(walletSigner) : 'null')
        console.log('Cluster:', cluster)
        console.log('Cluster type:', typeof cluster)
        console.log('Cluster keys:', cluster ? Object.keys(cluster) : 'null')
        console.log('Cluster ID:', cluster?.id)

        // Validate inputs
        if (!cluster?.id) {
          throw new Error(`Cluster ID is not available. Cluster: ${JSON.stringify(cluster)}`)
        }

        if (!walletSigner) {
          throw new Error('Wallet signer is not available')
        }

        const programId = getBootcampdappProgramId(cluster.id)
        console.log('Program ID:', programId)
        console.log('Program ID type:', typeof programId)

        // Manually generate the PDA for the journal entry
        const [journalEntryPda] = await getProgramDerivedAddress({
          programAddress: programId,
          seeds: [
            addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder()).encode(args.title),
            getAddressEncoder().encode(walletSigner.address),
          ],
        })
        console.log('Journal Entry PDA:', journalEntryPda)

        // Use the synchronous version with manually generated PDA
        let instruction
        try {
          instruction = getCreateJournalEntryInstruction({
            title: args.title,
            message: args.message,
            owner: walletSigner,
            journalEntry: journalEntryPda,
            // systemProgram will use the default System Program
          }, {
            programAddress: programId
          })
          console.log('Instruction created successfully')
        } catch (instructionError) {
          console.error('Error creating instruction:', instructionError)
          throw new Error(`Failed to create instruction: ${instructionError}`)
        }

        console.log('=== INSTRUCTION DEBUG ===')
        console.log('Instruction created:', instruction)
        console.log('Instruction type:', typeof instruction)
        console.log('Instruction keys:', Object.keys(instruction))
        console.log('Instruction accounts:', instruction.accounts)
        console.log('Instruction accounts details:', instruction.accounts.map(acc => ({
          address: acc.address.toString(),
          isSigner: 'isSigner' in acc ? acc.isSigner : 'N/A',
          isWritable: 'isWritable' in acc ? acc.isWritable : 'N/A',
        })))

        // Check if gill recognizes our signer
        const { isTransactionSigner } = await import('gill')
        console.log('Is walletSigner a TransactionSigner?', isTransactionSigner(walletSigner))
        console.log('Wallet signer properties:', {
          hasAddress: 'address' in walletSigner,
          address: walletSigner.address,
          hasSignAndSendTransactions: 'signAndSendTransactions' in walletSigner,
          signAndSendTransactionsType: typeof walletSigner.signAndSendTransactions,
        })

        console.log('Instruction data length:', instruction.data?.length)
        console.log('Instruction programAddress:', instruction.programAddress)
        console.log('=== END INSTRUCTION DEBUG ===')
        console.log('=== END DEBUG ===')
        return await signAndSend(instruction, walletSigner)
      } catch (error) {
        console.error('Error in createJournalEntryMutation:', error)
        if (error) {
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Unknown',
            error: error
          })
        } else {
          console.error('Error object is null/undefined')
        }
        throw error
      }
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ queryKey: ['bootcampdapp'] })
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      const errorMessage = error instanceof Error ? error.message :
        error ? String(error) : 'Unknown error occurred'
      toast.error(`Transaction failed! ${errorMessage}`)
    },
  })
}

export function useBootcampdappUpdateJournalEntryMutation() {
  const { cluster } = useWalletUi()
  const queryClient = useQueryClient()
  const walletSigner = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async (args: { title: string, message: string }) => {
      try {
        if (!cluster?.id) {
          throw new Error(`Cluster ID is not available. Cluster: ${JSON.stringify(cluster)}`)
        }

        if (!walletSigner) {
          throw new Error('Wallet signer is not available')
        }

        const programId = getBootcampdappProgramId(cluster.id)

        // Manually generate the PDA for the journal entry
        const [journalEntryPda] = await getProgramDerivedAddress({
          programAddress: programId,
          seeds: [
            addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder()).encode(args.title),
            getAddressEncoder().encode(walletSigner.address),
          ],
        })

        // Use the synchronous version with manually generated PDA
        const instruction = getUpdateJournalEntryInstruction({
          title: args.title,
          message: args.message,
          owner: walletSigner,
          journalEntry: journalEntryPda,
          // systemProgram will use the default System Program
        }, {
          programAddress: programId
        })

        return await signAndSend(instruction, walletSigner)
      } catch (error) {
        console.error('Error in updateJournalEntryMutation:', error)
        throw error
      }
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ queryKey: ['bootcampdapp'] })
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      const errorMessage = error instanceof Error ? error.message :
        error ? String(error) : 'Unknown error occurred'
      toast.error(`Transaction failed! ${errorMessage}`)
    },
  })
}

export function useBootcampdappDeleteJournalEntryMutation() {
  const { cluster } = useWalletUi()
  const queryClient = useQueryClient()
  const walletSigner = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async (args: { title: string }) => {
      try {
        if (!cluster?.id) {
          throw new Error(`Cluster ID is not available. Cluster: ${JSON.stringify(cluster)}`)
        }

        if (!walletSigner) {
          throw new Error('Wallet signer is not available')
        }

        const programId = getBootcampdappProgramId(cluster.id)

        // Manually generate the PDA for the journal entry
        const [journalEntryPda] = await getProgramDerivedAddress({
          programAddress: programId,
          seeds: [
            addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder()).encode(args.title),
            getAddressEncoder().encode(walletSigner.address),
          ],
        })

        // Use the synchronous version with manually generated PDA
        const instruction = getDeleteJournalEntryInstruction({
          title: args.title,
          owner: walletSigner,
          journalEntry: journalEntryPda,
          // systemProgram will use the default System Program
        }, {
          programAddress: programId
        })

        return await signAndSend(instruction, walletSigner)
      } catch (error) {
        console.error('Error in deleteJournalEntryMutation:', error)
        throw error
      }
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ queryKey: ['bootcampdapp'] })
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      const errorMessage = error instanceof Error ? error.message :
        error ? String(error) : 'Unknown error occurred'
      toast.error(`Transaction failed! ${errorMessage}`)
    },
  })
}

export function useBootcampdappAccountsQuery() {
  const { client } = useWalletUi()

  return useQuery({
    queryKey: useBootcampdappAccountsQueryKey(),
    queryFn: async () => await getBootcampdappProgramAccounts(client.rpc),
  })
}

function useBootcampdappAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useBootcampdappAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}

function useBootcampdappAccountsQueryKey() {
  const { cluster } = useWalletUi()

  return ['bootcampdapp', 'accounts', { cluster }]
}
