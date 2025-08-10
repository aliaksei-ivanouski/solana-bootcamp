import { ellipsify } from '@wallet-ui/react'
import {
  useBootcampdappAccountsQuery,
  useBootcampdappCloseMutation,
  useBootcampdappDecrementMutation,
  useBootcampdappIncrementMutation,
  useBootcampdappInitializeMutation,
  useBootcampdappProgram,
  useBootcampdappProgramId,
  useBootcampdappSetMutation,
} from './bootcampdapp-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExplorerLink } from '../cluster/cluster-ui'
import { BootcampdappAccount } from '@project/anchor'
import { ReactNode } from 'react'

export function BootcampdappProgramExplorerLink() {
  const programId = useBootcampdappProgramId()

  return <ExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}

export function BootcampdappList() {
  const bootcampdappAccountsQuery = useBootcampdappAccountsQuery()

  if (bootcampdappAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!bootcampdappAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {bootcampdappAccountsQuery.data?.map((bootcampdapp) => (
        <BootcampdappCard key={bootcampdapp.address} bootcampdapp={bootcampdapp} />
      ))}
    </div>
  )
}

export function BootcampdappProgramGuard({ children }: { children: ReactNode }) {
  const programAccountQuery = useBootcampdappProgram()

  if (programAccountQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!programAccountQuery.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }

  return children
}

function BootcampdappCard({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bootcampdapp: {bootcampdapp.data.count}</CardTitle>
        <CardDescription>
          Account: <ExplorerLink address={bootcampdapp.address} label={ellipsify(bootcampdapp.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <BootcampdappButtonIncrement bootcampdapp={bootcampdapp} />
          <BootcampdappButtonSet bootcampdapp={bootcampdapp} />
          <BootcampdappButtonDecrement bootcampdapp={bootcampdapp} />
          <BootcampdappButtonClose bootcampdapp={bootcampdapp} />
        </div>
      </CardContent>
    </Card>
  )
}

export function BootcampdappButtonInitialize() {
  const mutationInitialize = useBootcampdappInitializeMutation()

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Bootcampdapp {mutationInitialize.isPending && '...'}
    </Button>
  )
}

export function BootcampdappButtonIncrement({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  const incrementMutation = useBootcampdappIncrementMutation({ bootcampdapp })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}

export function BootcampdappButtonSet({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  const setMutation = useBootcampdappSetMutation({ bootcampdapp })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', bootcampdapp.data.count.toString() ?? '0')
        if (!value || parseInt(value) === bootcampdapp.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}

export function BootcampdappButtonDecrement({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  const decrementMutation = useBootcampdappDecrementMutation({ bootcampdapp })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}

export function BootcampdappButtonClose({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  const closeMutation = useBootcampdappCloseMutation({ bootcampdapp })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
