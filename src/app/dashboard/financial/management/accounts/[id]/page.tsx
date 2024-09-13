'use client'

import Loading from '@/app/dashboard/loading'
import GeralBox from '@/components/box/GeralBox'
import GeralButton from '@/components/buttons/GeralButton'
import PageHeader from '@/components/header/PageHeader'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import GeralModal from '@/components/modal/GeralModal'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import { ChangeEvent, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from './styles.module.scss'

interface FormData {
    id: number
    admin_id: number
    type: number
    bank_id: number
    agency: string
    account: string
    start_balance: string
    start_date: string
    status: number
}

export default function Page({ params }: { params: { id: number } }) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const searchParams = useSearchParams()
    const editing = searchParams.get('editing') == 'true'
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const [editMode, setEditMode] = useState(editing)
    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        id: 0,
        type: 0,
        bank_id: 0,
        agency: '',
        account: '',
        start_balance: '',
        start_date: '',
        status: 0,
    })
    const { data, isLoading, error } = useSWR(`/api/financial/management/accounts/read/${params.id}`, getFetch)
    const [banks, setBanks] = useState<any[]>([])

    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [deleteId, setDeleteId] = useState(0)

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    const handleEditButtonClick = async () => {
        if (!editMode) {
            setEditMode(true)
            return
        }

        if (!loading) {
            try {
                if (!loading) {
                    setLoading(true)
                    setToast({ text: 'Atualizando conta bancária', state: 'loading' })

                    await axios.post('/api/financial/management/accounts/form', formData)

                    setToast({ text: 'Conta bancária atualizado com sucesso', state: 'success' })
                    setLoading(false)
                    mutate(`/api/financial/management/accounts/read/${formData.id}`)

                    setEditMode(false)
                }
            } catch (error: any) {
                setLoading(false)
                WriteLog(error, 'error')
                const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                setToast({ text: message, state: 'danger' })
            }
        }
    }

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo conta bancária ${deleteName}`, state: 'loading' })

            await updateStatus('/api/financial/management/accounts/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteUserModal(false)

                setToast({ text: `Conta bancária ${deleteName} excluído`, state: 'success' })

                setTimeout(() => {
                    router.push('/dashboard/financeiro/gestao')
                }, 2000)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (data && !isLoading && !error) {
            setFormData({
                admin_id: data.account.admin_id,
                id: data.account.id,
                type: data.account.type,
                bank_id: data.account.bank_id,
                agency: data.account.agency,
                account: data.account.account,
                start_balance: data.account.start_balance,
                start_date: data.account.start_date,
                status: data.account.status,
            })

            setBanks(data.banks)
        }
    }, [data, isLoading, error])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados do conta bancária`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <PageHeader placeholder={`Pesquisar em "Gestão"`} />

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeIn' }}>
                <Link href='/dashboard/financeiro/gestao?tab=3' className={styles.backBtn}>
                    <IconifyIcon icon='ph:arrow-left' />
                    Contas bancárias
                </Link>
                <GeralBox variant='page' customClasses={[styles.pageBox]}>
                    <div className={styles.userGridWrapper}>
                        <div className={styles.userGridHeader}>
                            <div className={styles.mobileName}>
                                <h1>Conta bancária</h1>
                            </div>

                            <div className={styles.headerActions}>
                                <div className={`${styles.headerButtons} ${styles.mobileHeader}`}>
                                    <GeralButton
                                        variant={editMode ? 'secondary' : 'gray'}
                                        round
                                        small
                                        smallIcon
                                        onClick={handleEditButtonClick}
                                        disabled={loading}>
                                        {editMode ? (
                                            <IconifyIcon icon='iconamoon:check-bold' />
                                        ) : (
                                            <IconifyIcon icon='ph:pencil-simple' />
                                        )}
                                    </GeralButton>

                                    <GeralButton
                                        variant='delete'
                                        round
                                        small
                                        smallIcon
                                        disabled={loading}
                                        onClick={() => {
                                            setDeleteName('conta')
                                            setDeleteId(formData.id)
                                            setShowDeleteUserModal(!showDeleteUserModal)
                                        }}>
                                        <IconifyIcon icon='prime:trash' />
                                    </GeralButton>
                                </div>
                            </div>
                        </div>

                        <div className={styles.userGridContent}>
                            <div className={styles.geralInfo}>
                                <div className={styles.geralInfoForm}>
                                    <p>Informações gerais</p>
                                    <p>Informações detalhadas</p>

                                    <GeralInput
                                        label='Data de Abertura'
                                        name='start_date'
                                        type='date'
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.start_date}
                                        required
                                        readOnly={!editMode}
                                    />

                                    <GeralInput
                                        label='Banco/Operadora'
                                        name='bank_id'
                                        type='select'
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.bank_id}
                                        readOnly={!editMode}>
                                        <option value='0'>Selecione o banco</option>

                                        {banks.map((bank) => (
                                            <option key={`bank-${bank.id}`} value={bank.id}>
                                                {bank.name}
                                            </option>
                                        ))}
                                    </GeralInput>

                                    <GeralInput
                                        label='Saldo de Abertura'
                                        name='start_balance'
                                        type='text'
                                        maskVariant='price'
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.start_balance}
                                        required
                                        readOnly={!editMode}
                                    />

                                    <GeralInput
                                        label='Agência'
                                        name='agency'
                                        type='text'
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.agency}
                                        required
                                        readOnly={!editMode}
                                    />

                                    <GeralInput
                                        label='Situação'
                                        name='status'
                                        type='select'
                                        readOnly={!editMode}
                                        autoComplete='off'
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                            handleUserInputChange(e)
                                        }}
                                        // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                        required
                                        defaultValue={formData.status}>
                                        <option disabled value='0'>
                                            Selecione a opção
                                        </option>
                                        <option value='1'>Ativo</option>
                                        <option value='2'>Inativo</option>
                                    </GeralInput>

                                    <GeralInput
                                        label='Número da conta'
                                        name='account'
                                        type='text'
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        maxLength={11}
                                        defaultValue={formData.account}
                                        required
                                        readOnly={!editMode}
                                    />

                                    <div></div>
                                    <GeralInput
                                        label='Tipo'
                                        name='type'
                                        type='select'
                                        autoComplete='off'
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                            handleUserInputChange(e)
                                        }}
                                        readOnly={!editMode}
                                        // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                        defaultValue={formData.type}
                                        required>
                                        <option disabled value='0'>
                                            Selecione a opção
                                        </option>
                                        <option value='1'>Conta corrente</option>
                                        <option value='2'>Conta poupança</option>
                                    </GeralInput>
                                </div>
                            </div>
                        </div>
                    </div>
                </GeralBox>
            </motion.div>

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteUser}
                show={showDeleteUserModal}
                setShow={setShowDeleteUserModal}
                title='Excluir conta'
            />
        </>
    )
}
