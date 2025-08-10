import { WalletButton } from '../solana/solana-provider'
import { BootcampdappButtonInitialize, BootcampdappList, BootcampdappProgramExplorerLink, BootcampdappProgramGuard } from './bootcampdapp-ui'
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
            ? "Initialize a new bootcampdapp onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <BootcampdappProgramExplorerLink />
        </p>
        {account ? (
          <BootcampdappButtonInitialize />
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
