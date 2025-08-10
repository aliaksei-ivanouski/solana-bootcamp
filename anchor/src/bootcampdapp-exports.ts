// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, address, getBase58Decoder, SolanaClient } from 'gill'
import { SolanaClusterId } from '@wallet-ui/react'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import {
  BOOTCAMPDAPP_PROGRAM_ADDRESS,
  BootcampdappAccount as BootcampdappAccountEnum,
  identifyBootcampdappAccount,
  type ParsedBootcampdappInstruction
} from './client/js'
import {
  JOURNAL_ENTRY_STATE_DISCRIMINATOR,
  getJournalEntryStateDecoder,
  type JournalEntryState
} from './client/js/generated/accounts/journalEntryState'
import BootcampdappIDL from '../target/idl/bootcampdapp.json'

// Create the missing exports that were expected
// Convert discriminator bytes to base58 string for filtering
export const BOOTCAMPDAPP_DISCRIMINATOR = Buffer.from(JOURNAL_ENTRY_STATE_DISCRIMINATOR).toString('base64')

// Export the decoder function that was generated
export const getBootcampdappDecoder = getJournalEntryStateDecoder

// Export the main program type
export type Bootcampdapp = ParsedBootcampdappInstruction

export type BootcampdappAccount = Account<JournalEntryState, string>

// Re-export the generated IDL and type
export { BootcampdappIDL }

// This is a helper function to get the program ID for the Bootcampdapp program depending on the cluster.
export function getBootcampdappProgramId(cluster: SolanaClusterId) {
  switch (cluster) {
    case 'solana:localnet':
      // This is the program ID for the Bootcampdapp program on localnet (from Anchor.toml).
      return address('EJhsvpPeCpUChwyDEcKyJCLorDb89q1cfY4HPwutzF6')
    case 'solana:devnet':
    case 'solana:testnet':
      // This is the program ID for the Bootcampdapp program on devnet and testnet.
      return address('6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF')
    case 'solana:mainnet':
    default:
      return BOOTCAMPDAPP_PROGRAM_ADDRESS
  }
}

export * from './client/js'

export function getBootcampdappProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getBootcampdappDecoder(),
    filter: BOOTCAMPDAPP_DISCRIMINATOR,
    programAddress: BOOTCAMPDAPP_PROGRAM_ADDRESS,
  })
}
