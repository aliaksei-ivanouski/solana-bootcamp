import { ellipsify } from '@wallet-ui/react'
import {
  useBootcampdappAccountsQuery,
  useBootcampdappProgram,
  useBootcampdappProgramId,
  useBootcampdappCreateJournalEntryMutation,
  useBootcampdappUpdateJournalEntryMutation,
  useBootcampdappDeleteJournalEntryMutation,
} from './bootcampdapp-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '../ui/textarea'
import { ExplorerLink } from '../cluster/cluster-ui'
import { BootcampdappAccount } from '@project/anchor'
import { ReactNode, useState } from 'react'
import { useWalletUi } from '@wallet-ui/react'

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
        <CardTitle>Journal Entry: {bootcampdapp.data.title}</CardTitle>
        <CardDescription>
          Account: <ExplorerLink address={bootcampdapp.address} label={ellipsify(bootcampdapp.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Title:</strong> {bootcampdapp.data.title}</p>
          <p><strong>Message:</strong> {bootcampdapp.data.message}</p>
          <p><strong>Owner:</strong> {ellipsify(bootcampdapp.data.owner)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function BootcampdappCreateJournalEntry({ title, message }: { title: string; message: string }) {
  const createJournalEntryMutation = useBootcampdappCreateJournalEntryMutation()

  return (
    <Button onClick={() => createJournalEntryMutation.mutateAsync({ title, message })} disabled={createJournalEntryMutation.isPending}>
      Create Journal Entry
    </Button>
  )
}

export function UpdateJournalEntry({ title, message }: { title: string; message: string }) {
  const updateJournalEntryMutation = useBootcampdappUpdateJournalEntryMutation()

  return (
    <Button onClick={() => updateJournalEntryMutation.mutateAsync({ title, message })} disabled={updateJournalEntryMutation.isPending}>
      Update Journal Entry
    </Button>
  )
}

export function DeleteJournalEntry({ title }: { title: string }) {
  const deleteJournalEntryMutation = useBootcampdappDeleteJournalEntryMutation()

  return (
    <Button onClick={() => deleteJournalEntryMutation.mutateAsync({ title })} disabled={deleteJournalEntryMutation.isPending}>
      Delete Journal Entry
    </Button>
  )
}

export function JournalEntryForm() {
  const { account } = useWalletUi()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [operation, setOperation] = useState<'create' | 'update' | 'delete'>('create')

  const createJournalEntryMutation = useBootcampdappCreateJournalEntryMutation()
  const updateJournalEntryMutation = useBootcampdappUpdateJournalEntryMutation()
  const deleteJournalEntryMutation = useBootcampdappDeleteJournalEntryMutation()

  const isSubmitDisabled = !account || !title.trim() || (operation !== 'delete' && !message.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitDisabled) return

    try {
      switch (operation) {
        case 'create':
          await createJournalEntryMutation.mutateAsync({ title: title.trim(), message: message.trim() })
          break
        case 'update':
          await updateJournalEntryMutation.mutateAsync({ title: title.trim(), message: message.trim() })
          break
        case 'delete':
          await deleteJournalEntryMutation.mutateAsync({ title: title.trim() })
          break
      }

      // Reset form after successful operation
      setTitle('')
      setMessage('')
    } catch (error) {
      console.error('Operation failed:', error)
    }
  }

  const isLoading = createJournalEntryMutation.isPending || updateJournalEntryMutation.isPending || deleteJournalEntryMutation.isPending

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Journal Entry Operations</CardTitle>
        <CardDescription>Create, update, or delete journal entries</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation">Operation</Label>
            <select
              id="operation"
              value={operation}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOperation(e.target.value as 'create' | 'update' | 'delete')}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Enter journal entry title"
              required
            />
          </div>

          {operation !== 'delete' && (
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                placeholder="Enter journal entry message"
                rows={4}
                required
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitDisabled || isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' :
              operation === 'create' ? 'Create Entry' :
                operation === 'update' ? 'Update Entry' : 'Delete Entry'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}