'use client'

import Loading from '@/app/dashboard/loading'
import GeralBox from '@/components/box/GeralBox'
import GeralButton from '@/components/buttons/GeralButton'
import PageHeader from '@/components/header/PageHeader'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import GeralModal from '@/components/modal/GeralModal'
import TableSelect from '@/components/tables/TableSelect'
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
    email: string
    phone: string
    status: number
    type: number
    file: File | string | null
}

interface FormDataPassword {
    id: number
    password: string
    confirmPassword: string
}

const levelOptions = [
    {
        value: 1,
        label: 'Funcionário',
    },
    {
        value: 2,
        label: 'Terceiro',
    },
]

const statusOptions = [
    {
        value: 1,
        label: 'Ativo',
    },
    {
        value: 2,
        label: 'Inativo',
    },
]

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
        email: '',
        phone: '',
        status: 1,
        type: 1,
        file: null,
    })
    const { data, isLoading, error } = useSWR(`/api/financial/management/people/read/${params.id}`, getFetch)

    const [formDataPassword, setFormDataPassword] = useState<FormDataPassword>({
        id: params.id,
        password: '',
        confirmPassword: '',
    })

    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [deleteId, setDeleteId] = useState(0)

    // levels:admins,properties,interference_factors,inputs,crops,stocks,assets,reports,harvests

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let files: FileList | null = null
        const { name, value } = e.target

        if ('files' in e.target) {
            files = e.target.files
        }

        if (name == 'file' && files) {
            setFormData((prevData) => ({ ...prevData, [name]: files[0] }))
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }))
        }
    }

    const handleEditButtonClick = async () => {
        if (!editMode) {
            setEditMode(true)
            return
        }

        if (!loading) {
            setLoading(true)
            setToast({ text: `Atualizando registro`, state: 'loading' })

            try {
                if (!loading) {
                    setLoading(true)
                    setToast({ text: 'Atualizando pessoa', state: 'loading' })

                    const body = new FormData()
                    for (let [key, value] of Object.entries(formData)) {
                        if (value) {
                            if (key != 'file') {
                                value = value.toString()
                            }

                            body.append(key, value)
                        }
                    }
                    body.append('pathToUpload', 'people')

                    await axios.post('/api/financial/management/people/form', body)

                    setToast({ text: 'Cadastro atualizado com sucesso', state: 'success' })
                    setLoading(false)
                    mutate(`/api/financial/management/people/read/${formData.id}`)

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
            setToast({ text: `Excluindo pessoa ${deleteName}`, state: 'loading' });
            
            await updateStatus('/api/financial/management/people/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteUserModal(false);

                setToast({ text: `Pessoa ${deleteName} excluída`, state: 'success' });

                setTimeout(() => {
                    router.push('/dashboard/financeiro/gestao');
                }, 2000);
            });
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
                id: data.person.id,
                name: data.person.name,
                email: data.person.email,
                phone: data.person.phone,
                status: data.person.status,
                type: data.person.type,
                file: data.person.file,
            })
        }
    }, [data, isLoading, error])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR === 'true') {
                setToast({ text: `Falha ao obter dados da pessoa`, state: 'danger' });
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
                <Link href='/dashboard/financeiro/gestao?tab=1' className={styles.backBtn}>
                    <IconifyIcon icon='ph:arrow-left' />
                    Pessoas
                </Link>
                <GeralBox variant='page' customClasses={[styles.pageBox]}>
                    <div className={styles.userGridWrapper}>
                        <div className={styles.userGridHeader}>
                            <div className={styles.mobileName}>
                                <h1>{formData.name}</h1>
                            </div>

                            <div className={styles.headerActions}>
                                <div className={styles.selectionWrapper}>
                                    <div className={styles.headerSelect}>
                                        {editMode ? (
                                            <>
                                                <p>Tipo de pessoa</p>
                                                <TableSelect
                                                    itemId={params.id}
                                                    options={levelOptions}
                                                    defaultValue={formData.type}
                                                    name='type'
                                                    onChange={handleUserInputChange}
                                                    disabled={loading}
                                                    customOptionClass='rightSelect'
                                                />
                                            </>
                                        ) : undefined}
                                    </div>

                                    <div className={styles.headerSelect}>
                                        {editMode ? (
                                            <>
                                                <p>Situação</p>
                                                <TableSelect
                                                    itemId={params.id}
                                                    options={statusOptions}
                                                    defaultValue={formData.status}
                                                    name='status'
                                                    onChange={handleUserInputChange}
                                                    disabled={loading}
                                                    customOptionClass='rightSelect'
                                                />
                                            </>
                                        ) : undefined}
                                    </div>
                                </div>

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
                                        readOnly={!(editMode && !loading)}
                                        name='email'
                                        type='email'
                                        variant='inline'
                                        label='Email'
                                        defaultValue={formData.email}
                                        placeholder='Insira seu email'
                                        onChange={handleUserInputChange}
                                    />

                                    <GeralInput
                                        readOnly={!(editMode && !loading)}
                                        name='phone'
                                        type='phone'
                                        variant='inline'
                                        label='Telefone'
                                        maxLength={15}
                                        maskVariant='phone'
                                        defaultValue={formData.phone}
                                        placeholder='Insira seu telefone'
                                        onChange={handleUserInputChange}
                                        autoComplete='none'
                                    />
                                </div>
                            </div>

                            <GeralInput
                                label='Contrato'
                                name='file'
                                type='file'
                                placeholder='Digite aqui'
                                fileName={typeof formData.file == 'string' ? formData.file : formData.file?.name}
                                onChange={handleUserInputChange}
                                isContractFile={true}
                                additionalArgs={{
                                    fileTypeName: 'contrato',
                                    hasFile: typeof formData.file == 'string',
                                    fileHref: `${process.env.NEXT_PUBLIC_IMAGE_URL}/people/${formData.file}`,
                                    editMode,
                                }}
                            />
                        </div>
                    </div>
                </GeralBox>
            </motion.div>

            <GeralModal show={showChangePasswordModal} setShow={setShowChangePasswordModal} title='Alterar senha'>
                <div className={styles.modalContent}>
                    <GeralInput
                        name='password'
                        type='password'
                        label='Nova senha'
                        placeholder='*****'
                        defaultValue={formDataPassword.password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setFormDataPassword((prevData) => ({ ...prevData, password: e.target.value }))
                        }}
                    />

                    <GeralInput
                        name='confirmPassword'
                        type='password'
                        label='Confirmar senha'
                        placeholder='*****'
                        defaultValue={formDataPassword.confirmPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setFormDataPassword((prevData) => ({ ...prevData, confirmPassword: e.target.value }))
                        }}
                    />

                    <div className={styles.actions}>
                        <GeralButton
                            variant='tertiary'
                            value='Cancelar'
                            onClick={() => setShowChangePasswordModal(false)}
                        />
                        <GeralButton
                            variant='secondary'
                            value='Alterar senha'
                            onClick={async () => {
                                if (formDataPassword.password == '') {
                                    setToast({ text: `A senha não pode ser vazia`, state: 'warning' })
                                    return
                                }

                                if (formDataPassword.password == formDataPassword.confirmPassword) {
                                    setToast({ text: `Alterando senha`, state: 'loading' })

                                    try {
                                        const response = await axios.post('/api/user/recover', formDataPassword)

                                        if (response.status == 200) {
                                            setToast({ text: `Senha alterada`, state: 'success' })
                                            setShowChangePasswordModal(false)
                                        } else {
                                            setToast({ text: `Não foi possível alterar a senha`, state: 'danger' })
                                        }
                                    } catch (error: any) {
                                        WriteLog(error, 'error')
                                        const message =
                                            error?.response?.data?.error ??
                                            'Não foi possível completar a operação no momento'
                                        setToast({ text: message, state: 'danger' })
                                    }
                                } else {
                                    setToast({ text: `As senhas não coincidem`, state: 'warning' })
                                }
                            }}
                        />
                    </div>
                </div>
            </GeralModal>

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteUser}
                show={showDeleteUserModal}
                setShow={setShowDeleteUserModal}
                title='Excluir pessoa'
            />
        </>
    )
}
