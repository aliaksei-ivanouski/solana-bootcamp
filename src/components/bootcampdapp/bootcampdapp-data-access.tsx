import {
  BootcampdappAccount,
  getCloseInstruction,
  getBootcampdappProgramAccounts,
  getBootcampdappProgramId,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '@project/anchor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { generateKeyPairSigner } from 'gill'
import { useWalletUi } from '@wallet-ui/react'
import { useWalletTransactionSignAndSend } from '../solana/use-wallet-transaction-sign-and-send'
import { useClusterVersion } from '@/components/cluster/use-cluster-version'
import { toastTx } from '@/components/toast-tx'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { install as installEd25519 } from '@solana/webcrypto-ed25519-polyfill'

// polyfill ed25519 for browsers (to allow `generateKeyPairSigner` to work)
installEd25519()

export function useBootcampdappProgramId() {
  const { cluster } = useWalletUi()
  return useMemo(() => getBootcampdappProgramId(cluster.id), [cluster])
}

export function useBootcampdappProgram() {
  const { client, cluster } = useWalletUi()
  const programId = useBootcampdappProgramId()
  const query = useClusterVersion()

  return useQuery({
    retry: false,
    queryKey: ['get-program-account', { cluster, clusterVersion: query.data }],
    queryFn: () => client.rpc.getAccountInfo(programId).send(),
  })
}

export function useBootcampdappInitializeMutation() {
  const { cluster } = useWalletUi()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => {
      const bootcampdapp = await generateKeyPairSigner()
      return await signAndSend(getInitializeInstruction({ payer: signer, bootcampdapp }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ queryKey: ['bootcampdapp', 'accounts', { cluster }] })
    },
    onError: () => toast.error('Failed to run program'),
  })
}

export function useBootcampdappDecrementMutation({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  const invalidateAccounts = useBootcampdappAccountsInvalidate()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ bootcampdapp: bootcampdapp.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useBootcampdappIncrementMutation({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  const invalidateAccounts = useBootcampdappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ bootcampdapp: bootcampdapp.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useBootcampdappSetMutation({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  const invalidateAccounts = useBootcampdappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async (value: number) =>
      await signAndSend(
        getSetInstruction({
          bootcampdapp: bootcampdapp.address,
          value,
        }),
        signer,
      ),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useBootcampdappCloseMutation({ bootcampdapp }: { bootcampdapp: BootcampdappAccount }) {
  const invalidateAccounts = useBootcampdappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => {
      return await signAndSend(getCloseInstruction({ payer: signer, bootcampdapp: bootcampdapp.address }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
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
