// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, address, getBase58Decoder, SolanaClient } from 'gill'
import { SolanaClusterId } from '@wallet-ui/react'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Bootcampdapp, BOOTCAMPDAPP_DISCRIMINATOR, BOOTCAMPDAPP_PROGRAM_ADDRESS, getBootcampdappDecoder } from './client/js'
import BootcampdappIDL from '../target/idl/bootcampdapp.json'

export type BootcampdappAccount = Account<Bootcampdapp, string>

// Re-export the generated IDL and type
export { BootcampdappIDL }

// This is a helper function to get the program ID for the Bootcampdapp program depending on the cluster.
export function getBootcampdappProgramId(cluster: SolanaClusterId) {
  switch (cluster) {
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
    filter: getBase58Decoder().decode(BOOTCAMPDAPP_DISCRIMINATOR),
    programAddress: BOOTCAMPDAPP_PROGRAM_ADDRESS,
  })
}
