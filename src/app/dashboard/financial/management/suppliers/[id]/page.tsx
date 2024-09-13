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
import { getStateKey, getStaticCities, getStaticStates } from '@/utils/getStaticLocation'
import { getStateKeyBolivia, getStaticStatesBolivia } from '@/utils/getStaticLocationBolivia'
import { getStateKeyParaguai, getStaticStatesParaguai } from '@/utils/getStaticLocationParaguai'
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
    admin_id: number;
    id: number;
    name: string;
    corporate_name: string;
    email: string;
    phone: string;
    type: number;
    document: string;
    state_registration: string;
    branch_of_activity: string;
    cep: string;
    country: string;
    state: string;
    city: string;
    number: number;
    street: string;
    complement: string;
    reference: string;
    account_id: number;
    bank: string;
    agency: string;
    account: string;
    new_account: boolean;
}

const typeOptions = [
    {
        value: 1,
        label: 'Pessoa física',
    },
    {
        value: 2,
        label: 'Pessoa jurídica',
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
        id: 0,
        name: '',
        corporate_name: '',
        email: '',
        phone: '',
        type: 0,
        document: '',
        state_registration: '',
        branch_of_activity: '',
        cep: '',
        country: '',
        state: '',
        city: '',
        number: 0,
        street: '',
        complement: '',
        reference: '',
        account_id: 0,
        bank: '',
        agency: '',
        account: '',
        new_account: false,

    });
    const { data, isLoading, error } = useSWR(`/api/financial/management/suppliers/read/${params.id}`, getFetch);

    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [deleteId, setDeleteId] = useState(0)

    const [stateId, setStateId] = useState<string | number | null>(null)
    const states = getStaticStates()
    const statesParaguai = getStaticStatesParaguai()
    const statesBolivia = getStaticStatesBolivia()
    const [statesToUse, setStatesToUse] = useState<any>(states)
    const cities = getStaticCities(stateId)

    const updateCities = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target
        const key = getStateKey(value)
        setStateId(key)
    }

    const updateStates = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target

        const key = null

        switch (value) {
            case 'Brasil':
                getStateKey(value)
                setStatesToUse(states)
                break
            case 'Paraguai':
                getStateKeyParaguai(value)
                setStatesToUse(statesParaguai)
                break
            case 'Bolívia':
                getStateKeyBolivia(value)
                setStatesToUse(statesBolivia)
                break
        }

        setStateId(key)
    }

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
                    setToast({ text: 'Atualizando fornecedor', state: 'loading' })

                    await axios.post('/api/financial/management/suppliers/form', formData)

                    setToast({ text: 'Fornecedor atualizado com sucesso', state: 'success' })
                    setLoading(false)
                    mutate(`/api/financial/management/suppliers/read/${formData.id}`)

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
            setToast({ text: `Excluindo fornecedor ${deleteName}`, state: 'loading' })

            await updateStatus('/api/financial/management/suppliers/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteUserModal(false)

                setToast({ text: `Fornecedor ${deleteName} excluído`, state: 'success' })

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
                admin_id: data.supplier.admin_id,
                id: data.supplier.id,
                name: data.supplier.name,
                corporate_name: data.supplier.corporate_name,
                email: data.supplier.email,
                phone: data.supplier.phone,
                type: data.supplier.type,
                document: data.supplier.document,
                state_registration: data.supplier.state_registration,
                branch_of_activity: data.supplier.branch_of_activity,
                cep: data.supplier.cep,
                country: data.supplier.country,
                state: data.supplier.state,
                city: data.supplier.city,
                number: data.supplier.number,
                street: data.supplier.street,
                complement: data.supplier.complement,
                reference: data.supplier.reference,
                account_id: data.supplier.account.id,
                bank: data.supplier.account.bank.name,
                agency: data.supplier.account.agency,
                account: data.supplier.account.account,
                new_account: false,
            });
            
        }
    }, [data, isLoading, error])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados do fornecedor`, state: 'danger' })
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
                <Link href='/dashboard/financeiro/gestao?tab=2' className={styles.backBtn}>
                    <IconifyIcon icon='ph:arrow-left' />
                    Fornecedores
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
                                                <p>Tipo de fornecedor</p>
                                                <TableSelect
                                                    itemId={params.id}
                                                    options={typeOptions}
                                                    defaultValue={formData.type}
                                                    name='type'
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
                            <div className={styles.firstColumn}>
                                <div className={styles.geralInfo}>
                                    <p>Informações gerais</p>

                                    <div className={styles.geralInfoForm}>
                                        <GeralInput
                                            customClasses={[styles.closestInput]}
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
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='state_registration'
                                            type='text'
                                            variant='inline'
                                            label='Inscrição Estadual'
                                            defaultValue={formData.state_registration}
                                            placeholder='Digite aqui'
                                            onChange={handleUserInputChange}
                                        />

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
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
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='branch_of_activity'
                                            type='text'
                                            variant='inline'
                                            label='Ramo de Atividade'
                                            defaultValue={formData.branch_of_activity}
                                            placeholder='Digite aqui'
                                            onChange={handleUserInputChange}
                                        />

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='phone'
                                            type='text'
                                            variant='inline'
                                            label='Telefone'
                                            maxLength={15}
                                            maskVariant='phone'
                                            defaultValue={formData.phone}
                                            placeholder='Insira seu telefone'
                                            onChange={handleUserInputChange}
                                            autoComplete='none'
                                        />

                                        {formData.type == 2 && (
                                            <GeralInput
                                                customClasses={[styles.closestInput]}
                                                readOnly={!(editMode && !loading)}
                                                name='corporate_name'
                                                type='text'
                                                variant='inline'
                                                label='Razão Social'
                                                defaultValue={formData.corporate_name}
                                                placeholder='Digite aqui'
                                                onChange={handleUserInputChange}
                                            />
                                        )}

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='document'
                                            label={formData.type == 1 ? 'CPF' : 'CNPJ'}
                                            maskVariant={formData.type == 1 ? 'cpf' : 'cnpj'}
                                            type='text'
                                            variant='inline'
                                            defaultValue={formData.document}
                                            placeholder='Digite aqui'
                                            onChange={handleUserInputChange}
                                        />
                                    </div>
                                </div>

                                <div className={styles.geralInfo}>
                                    <p>Localização</p>

                                    <div className={styles.geralInfoForm}>
                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='cep'
                                            type='text'
                                            variant='inline'
                                            label='CEP'
                                            defaultValue={formData.cep}
                                            placeholder='Insira seu nome'
                                            onChange={handleUserInputChange}
                                        />

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='number'
                                            type='text'
                                            variant='inline'
                                            label='Número'
                                            defaultValue={formData.number}
                                            placeholder='Digite aqui'
                                            onChange={handleUserInputChange}
                                        />

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            variant='inline'
                                            defaultValue={formData.country}
                                            label='País'
                                            name='country'
                                            type='select'
                                            placeholder='Selecione o País'
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                handleUserInputChange(e)
                                                updateStates(e)
                                            }}
                                            required>
                                            <option disabled value=''>
                                                Selecione
                                            </option>
                                            <option value='Brasil'>Brasil</option>
                                            <option value='Paraguai'>Paraguai</option>
                                            <option value='Bolívia'>Bolívia</option>
                                        </GeralInput>

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='complement'
                                            type='text'
                                            variant='inline'
                                            label='Complemento'
                                            defaultValue={formData.complement}
                                            placeholder='Digite aqui'
                                            onChange={handleUserInputChange}
                                        />

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            variant='inline'
                                            defaultValue={formData.state}
                                            label='Estado'
                                            name='state'
                                            type='select'
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                handleUserInputChange(e)

                                                if (formData.country == 'Brasil') {
                                                    updateCities(e)
                                                }
                                            }}
                                            required>
                                            <option disabled value=''>
                                                Selecione
                                            </option>

                                            {statesToUse &&
                                                statesToUse.map((state: any) => (
                                                    <option key={state.name} value={state.initial}>
                                                        {state.name}
                                                    </option>
                                                ))}
                                        </GeralInput>

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='reference'
                                            type='text'
                                            variant='inline'
                                            label='Referência'
                                            defaultValue={formData.reference}
                                            placeholder='Digite aqui'
                                            onChange={handleUserInputChange}
                                        />

                                        {formData.country == 'Brasil' && (
                                            <GeralInput
                                                customClasses={[styles.closestInput]}
                                                readOnly={!(editMode && !loading)}
                                                variant='inline'
                                                defaultValue={formData.city}
                                                label='Município'
                                                name='city'
                                                type='select'
                                                onChange={handleUserInputChange}
                                                required>
                                                <option disabled value=''>
                                                    Selecione
                                                </option>

                                                {cities &&
                                                    cities.map((city: any) => (
                                                        <option key={city.name} value={city.name}>
                                                            {city.name}
                                                        </option>
                                                    ))}
                                            </GeralInput>
                                        )}

                                        <GeralInput
                                            customClasses={[styles.closestInput]}
                                            readOnly={!(editMode && !loading)}
                                            name='street'
                                            type='text'
                                            variant='inline'
                                            label='Logradouro'
                                            defaultValue={formData.street}
                                            placeholder='Digite aqui'
                                            onChange={handleUserInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.secondColumn}>
                                <div className={`${styles.geralInfo} ${styles.noBorder}`}>
                                    <p>Dados bancários</p>

                                    <div className={`${styles.geralInfoForm} ${styles.oneColumn}`}>
                                        {editMode && 
                                            <GeralInput
                                                label='Conta bancária'
                                                name='account_id'
                                                type='select'
                                                placeholder='Digite aqui'
                                                defaultValue={formData.account_id}
                                                onChange={handleUserInputChange}
                                            >
                                                <option value="0">Selecione a conta</option>
            
                                                {
                                                    data.accounts.map((account: any) => (
                                                        <option key={`bank-${account.id}`} value={account.id}>
                                                            <div className={styles.bankProfile}>
                                                                <img src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/banks/${account.bank.image}`} alt="Banco" className={styles.bankImage} />
                                                                <p
                                                                    title={`${account.bank?.name}`}>
                                                                    {`${account.bank?.name} Ag: ${account.agency} N.º: ${account.account}`}
                                                                </p>
                                                            </div>
                                                        </option>
                                                    ))
                                                }
                                            </GeralInput>
                                        }

                                        {!editMode && 

                                            <>
                                                <GeralInput
                                                    customClasses={[styles.closestInput]}
                                                    readOnly={true}
                                                    name='bank'
                                                    type='text'
                                                    variant='inline'
                                                    label='Banco'
                                                    defaultValue={formData.bank}
                                                    placeholder='Digite aqui'
                                                    onChange={handleUserInputChange}
                                                />

                                                <GeralInput
                                                    customClasses={[styles.closestInput]}
                                                    readOnly={true}
                                                    name='agency'
                                                    type='text'
                                                    variant='inline'
                                                    label='Agência'
                                                    defaultValue={formData.agency}
                                                    placeholder='Digite aqui'
                                                    onChange={handleUserInputChange}
                                                />

                                                <GeralInput
                                                    customClasses={[styles.closestInput]}
                                                    readOnly={true}
                                                    name='account'
                                                    type='text'
                                                    variant='inline'
                                                    label='Conta'
                                                    defaultValue={formData.account}
                                                    placeholder='Digite aqui'
                                                    onChange={handleUserInputChange}
                                                />
                                            </>
                                        }

                                    </div>
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
                title='Excluir fornecedor'
            />
        </>
    )
}
