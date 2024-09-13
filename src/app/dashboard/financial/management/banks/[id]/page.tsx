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
    admin_id: number
    id: number
    name: string
    image: File | string | null
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
        id: params.id,
        name: '',
        image: null,
    })
    const { data, isLoading, error } = useSWR(`/api/financial/management/banks/read/${params.id}`, getFetch)

    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [deleteId, setDeleteId] = useState(0)

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let files: FileList | null = null
        const { name, value } = e.target

        if ('files' in e.target) {
            files = e.target.files
        }

        if (name == 'image' && files) {
            setFormData((prevData) => ({ ...prevData, [name]: files ? files[0] : null }))
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }))
        }
    }

    const handleEditButtonClick = async () => {
        if (!editMode) {
            setEditMode(true)
            return
        }

        try {
            if (!loading) {
                setLoading(true)
                setToast({ text: 'Atualizando banco', state: 'loading' })

                const body = new FormData()
                for (let [key, value] of Object.entries(formData)) {
                    if (value) {
                        if (key != 'image') {
                            value = value.toString()
                        }

                        body.append(key, value)
                    }
                }
                body.append('pathToUpload', 'banks')

                await axios.post('/api/financial/management/banks/form', body)

                setToast({ text: 'Cadastro atualizado com sucesso', state: 'success' })
                setLoading(false)
                mutate(`/api/financial/management/banks/read/${formData.id}`)

                setEditMode(false)
            }
        } catch (error: any) {
            setLoading(false)
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo banco ${deleteName}`, state: 'loading' })

            await updateStatus('/api/banks/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteUserModal(false)

                setToast({ text: `Banco ${deleteName} excluído`, state: 'success' })

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
                admin_id: admin.id,
                id: data.bank.id,
                name: data.bank.name,
                image: data.bank.image,
            })
        }
    }, [data, isLoading, error])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados do banco`, state: 'danger' })
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
                <Link href='/dashboard/financeiro/gestao?tab=5' className={styles.backBtn}>
                    <IconifyIcon icon='ph:arrow-left' />
                    Bancos
                </Link>
                <GeralBox variant='page' customClasses={[styles.pageBox]}>
                    <div className={styles.userGridWrapper}>
                        <div className={styles.userGridHeader}>
                            <div className={styles.mobileName}>
                                <h1>{formData.name}</h1>
                            </div>

                            <div className={styles.headerActions}>
                                <div className={styles.selectionWrapper}></div>

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
                                            setDeleteName(formData.name)
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
                                <p>Informações gerais</p>

                                <div className={styles.geralInfoForm}>
                                    <GeralInput
                                        readOnly={!(editMode && !loading)}
                                        name='name'
                                        type='text'
                                        variant='inline'
                                        label='Nome'
                                        defaultValue={formData.name}
                                        placeholder='Insira seu nome'
                                        onChange={handleUserInputChange}
                                    />
                                    <GeralInput
                                        label='Imagem (100x100px)'
                                        name='image'
                                        type='file'
                                        placeholder='Digite aqui'
                                        fileName={
                                            typeof formData.image == 'string' ? formData.image : formData.image?.name
                                        }
                                        onChange={handleUserInputChange}
                                        isContractFile={true}
                                        additionalArgs={{
                                            fileTypeName: 'logo',
                                            hasFile: typeof formData.image == 'string',
                                            fileHref: `${process.env.NEXT_PUBLIC_IMAGE_URL}/banks/${formData.image}`,
                                            editMode,
                                        }}
                                    />
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
                title='Excluir banco'
            />
        </>
    )
}
