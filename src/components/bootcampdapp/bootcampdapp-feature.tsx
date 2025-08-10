import { WalletButton } from '../solana/solana-provider'
import { BootcampdappList, BootcampdappProgramExplorerLink, BootcampdappProgramGuard, JournalEntryForm } from './bootcampdapp-ui'
import { AppHero } from '../app-hero'
import { useWalletUi } from '@wallet-ui/react'

export default function BootcampdappFeature() {
  const { account } = useWalletUi()

  return (
    <BootcampdappProgramGuard>
      <AppHero
        title="Bootcampdapp"
        subtitle={
          account
            ? "Create, update, or delete journal entries using the form below. All operations are performed on-chain through the Solana program."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <BootcampdappProgramExplorerLink />
        </p>
        {account ? (
          <JournalEntryForm />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletButton />
          </div>
        )}
      </AppHero>
      {account ? <BootcampdappList /> : null}
    </BootcampdappProgramGuard>
  )
}
