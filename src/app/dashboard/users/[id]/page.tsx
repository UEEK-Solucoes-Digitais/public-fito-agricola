'use client'

import Property from '@/@types/Property'
import GeralBox from '@/components/box/GeralBox'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableActions from '@/components/tables/TableActions'
import TableRow from '@/components/tables/TableRow'
import TableSelect from '@/components/tables/TableSelect'
import { AccessConsts } from '@/consts/AccessConsts'
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
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import { ChangeEvent, Fragment, useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import Loading from '../../loading'
import styles from './styles.module.scss'

interface FormData {
    id: number
    name: string
    email: string
    cpf: string
    phone: string
    access_level: number
    level: string[]
    status: number
    profile_picture: any
    properties_available: number
    state: string
    city: string
    country: string
    access_ma: boolean
}

interface FormDataPassword {
    id: number
    password: string
    confirmPassword: string
}

const levelOptions = [
    {
        value: 1,
        label: 'Administrador',
    },
    {
        value: 3,
        label: 'Consultor',
    },
    {
        value: 4,
        label: 'M.A',
    },
    {
        value: 5,
        label: 'Equipe',
    },
    {
        value: 2,
        label: 'Produtor',
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

// levels:admins,properties,interference_factors,inputs,crops,stocks,assets,reports,harvests
const accessLevels = [
    {
        level: AccessConsts.ASSETS,
        label: 'Bens',
    },
    {
        level: AccessConsts.CONTENTS,
        label: 'Conteúdos (blog)',
    },
    {
        level: AccessConsts.COSTS,
        label: 'Gráfico de custos (propriedades)',
    },
    {
        level: AccessConsts.STOCKS,
        label: 'Estoques',
    },
    {
        level: AccessConsts.INTERFERENCE_FACTORS,
        label: 'Fatores de interferência',
    },
    {
        level: AccessConsts.INPUTS,
        label: 'Insumos',
    },
    {
        level: AccessConsts.CROPS,
        label: 'Lavouras',
    },
    {
        level: AccessConsts.PROPERTIES,
        label: 'Propriedades',
    },
    {
        level: AccessConsts.REPORTS,
        label: 'Relatórios',
    },
    // {
    //     level: AccessConsts.HARVESTS,
    //     label: 'Anos Agrícolas',
    // },
    {
        level: AccessConsts.ADMINS,
        label: 'Usuários',
    },
]

const tablePropertyHeaders = ['Nome', 'Município', '']

export default function Page({ params }: { params: { id: number } }) {
    const { setToast } = useNotification()
    const { admin, setAdmin } = useAdmin()
    const searchParams = useSearchParams()
    const editing = searchParams.get('editing') == 'true'
    const [loading, setLoading] = useState(false)
    const [properties, setProperties] = useState<Property[]>([])
    const router = useRouter()
    const [editMode, setEditMode] = useState(editing)
    const [formData, setFormData] = useState<FormData>({
        id: params.id,
        name: '',
        email: '',
        cpf: '',
        phone: '',
        access_level: 1,
        status: 1,
        level: [],
        profile_picture: null,
        properties_available: 0,
        state: '',
        city: '',
        country: '',
        access_ma: false,
    })
    const { data, isLoading, error } = useSWR(`/api/user/read/${params.id}`, getFetch)

    const [formDataPassword, setFormDataPassword] = useState<FormDataPassword>({
        id: params.id,
        password: '',
        confirmPassword: '',
    })

    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [deleteId, setDeleteId] = useState(0)
    const [imagePreview, setImagePreview] = useState('')
    const [imagePreviewLoading, setImagePreviewLoading] = useState(true)
    const [openMobile, setOpenMobile] = useState(false)
    const [stateId, setStateId] = useState<string | number | null>(null)
    const states = getStaticStates()
    const statesParaguai = getStaticStatesParaguai()
    const statesBolivia = getStaticStatesBolivia()
    const [statesToUse, setStatesToUse] = useState<any>(data?.admin.country == 'Brasil' ? states : statesParaguai)
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

        if (name.includes('level_')) {
            const level = formData.level

            if (formData.level.includes(value)) {
                const index = level.indexOf(value)
                level.splice(index, 1)
            } else {
                level.push(value)
            }

            setFormData((prevData) => ({ ...prevData, level }))
            return
        }

        if (name == 'access_ma') {
            setFormData((prevData) => ({ ...prevData, [name]: !formData.access_ma }))
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }))
        }
    }

    const handleEditButtonClick = useCallback(async () => {
        if (!editMode) {
            setEditMode(true)
            return
        }

        setOpenMobile(false)

        if (!loading) {
            setLoading(true)
            setToast({ text: `Atualizando usuário`, state: 'loading' })

            const body = new FormData()
            body.append('pathToUpload', 'admins')
            body.append('admin_id', admin.id.toString())

            for (const [key, value] of Object.entries(formData)) {
                body.append(key, value)
            }

            try {
                axios
                    .post('/api/user/update', body, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    })
                    .then((response) => {
                        if (response.status == 200) {
                            setToast({ text: `Usuário atualizado`, state: 'success' })

                            if (admin.id == formData.id) {
                                setAdmin(response.data.admin)
                            }
                        } else {
                            setToast({ text: `Não foi possível atualizar`, state: 'danger' })
                        }

                        setLoading(false)
                    })
                    .catch((error: any) => {
                        throw error
                    })
            } catch (error: any) {
                WriteLog(error, 'error')
                const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                setToast({ text: message, state: 'danger' })
            }
        }
    }, [admin.id, editMode, formData, loading, setAdmin, setToast])

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo usuário ${deleteName}`, state: 'loading' })

            await updateStatus('/api/user/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteUserModal(false)

                setToast({ text: `Usuário ${deleteName} excluído`, state: 'success' })

                setTimeout(() => {
                    router.push('/dashboard/usuarios')
                }, 2000)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
        const { files } = e.target

        if (files && files[0]) {
            const file = files[0]
            const fileSize = file.size ?? 0
            const megabytes = 20

            if (fileSize > megabytes * 1024 * 1024) {
                setToast({ text: 'A soma dos tamanhos dos arquivos excede o limite de 20MB', state: 'warning' })
                return
            }

            setFormData((prevData) => ({ ...prevData, profile_picture: file }))
            setImagePreview(URL.createObjectURL(file))
            setImagePreviewLoading(true)
        }
    }

    useEffect(() => {
        if (data && !isLoading && !error) {
            setFormData({
                id: data.admin.id,
                name: data.admin.name,
                email: data.admin.email,
                cpf: data.admin.cpf && data.admin.cpf != 'null' ? data.admin.cpf : '',
                phone: data.admin.phone,
                access_level: data.admin.access_level,
                status: data.admin.status,
                level: data.admin.level.toString().split(','),
                profile_picture: data.admin.profile_picture,
                properties_available: data.admin.properties_available,
                country: data.admin.country ?? '',
                state: data.admin.state ?? '',
                city: data.admin.city ?? '',
                access_ma: data.admin.access_ma ?? false,
            })

            if (data.admin.state) {
                const key = getStateKey(data.admin.state)
                setStateId(key)
            }

            if (data.admin.profile_picture && imagePreview.length == 0) {
                setImagePreview(`${process.env.NEXT_PUBLIC_IMAGE_URL}/admins/${data.admin.profile_picture}`)
                setImagePreviewLoading(true)
            }

            setProperties(data.properties)
        }
    }, [data, isLoading, error, properties])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados do usuário`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeIn' }}>
                <Link href='/dashboard/usuarios' className={styles.backBtn}>
                    <IconifyIcon icon='ph:arrow-left' />
                    Usuários
                </Link>

                <GeralBox variant='page' customClasses={[styles.pageBox]}>
                    <div className={styles.userGridWrapper}>
                        <div className={styles.userGridHeader}>
                            <div className={styles.mobileName}>
                                <h1>{formData.name}</h1>
                                <div className={styles.mobileActions}>
                                    <button
                                        onClick={() => {
                                            setOpenMobile(!openMobile)
                                        }}>
                                        <IconifyIcon icon='pepicons-pencil:dots-y' />
                                    </button>

                                    <div className={`${styles.actions} ${openMobile ? styles.open : ''}`}>
                                        <button
                                            className={`${styles.actionItem} ${
                                                editMode ? styles.secondary : styles.gray
                                            }`}
                                            onClick={handleEditButtonClick}>
                                            <IconifyIcon
                                                icon={editMode ? 'iconamoon:check-bold' : 'ph:pencil-simple'}
                                            />
                                            {editMode ? 'Salvar' : 'Editar'}
                                        </button>

                                        <button
                                            className={`${styles.actionItem} ${styles.delete}`}
                                            onClick={() => {
                                                setOpenMobile(!openMobile)
                                                setDeleteName(formData.name)
                                                setDeleteId(formData.id)
                                                setShowDeleteUserModal(!showDeleteUserModal)
                                            }}>
                                            <IconifyIcon icon='prime:trash' />
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.headerActions}>
                                {formData.id != admin.id && (
                                    <div className={styles.selectionWrapper}>
                                        <div className={styles.headerSelect}>
                                            <p>Tipo de usuário</p>
                                            <TableSelect
                                                itemId={params.id}
                                                options={levelOptions}
                                                defaultValue={formData.access_level}
                                                name='access_level'
                                                onChange={handleUserInputChange}
                                                disabled={loading}
                                                customOptionClass='rightSelect'
                                            />
                                        </div>

                                        <div className={styles.headerSelect}>
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
                                        </div>
                                    </div>
                                )}

                                <div className={`${styles.headerButtons} ${styles.mobileHeader}`}>
                                    <GeralButton
                                        variant='tertiary'
                                        type='button'
                                        small
                                        value='Alterar senha'
                                        onClick={() => setShowChangePasswordModal(!showChangePasswordModal)}>
                                        <IconifyIcon icon='ph:lock-simple' />
                                    </GeralButton>

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

                                    {formData.id != admin.id && (
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
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.userGridContent}>
                            <div className={styles.geralInfo}>
                                <p>Informações gerais</p>

                                <div className={styles.geralInfoFrm}>
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
                                        name='document'
                                        type='text'
                                        variant='inline'
                                        label='CPF'
                                        maxLength={14}
                                        maskVariant='cpf'
                                        defaultValue={formData.cpf}
                                        placeholder='Insira seu CPF'
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

                                    <GeralInput
                                        readOnly={!(editMode && !loading)}
                                        defaultValue={formData.country}
                                        label='País'
                                        variant='inline'
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
                                        <option disabled value='Brasil'>
                                            Brasil
                                        </option>
                                        <option disabled value='Bolívia'>
                                            Bolívia
                                        </option>
                                        <option disabled value='Paraguai'>
                                            Paraguai
                                        </option>
                                    </GeralInput>

                                    <GeralInput
                                        defaultValue={formData.state}
                                        readOnly={!(editMode && !loading)}
                                        label='Estado'
                                        name='state'
                                        type='select'
                                        variant='inline'
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
                                        defaultValue={formData.city}
                                        readOnly={!(editMode && !loading)}
                                        label='Município'
                                        name='city'
                                        type='select'
                                        variant='inline'
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

                                    <div className={`${styles.imageGroupInput} ${!editMode ? styles.disabled : ''}`}>
                                        <label>Imagem de perfil</label>
                                        <div
                                            className={`${styles.group} ${styles.imageGroup} ${
                                                imagePreview.length > 0 && imagePreviewLoading ? styles.loading : ''
                                            }`}
                                            data-disabled={loading}>
                                            <label
                                                htmlFor='input-media'
                                                className={styles.imagePreview}
                                                title='Clique para anexar arquivos'
                                                data-loading={loading}>
                                                <input
                                                    id='input-media'
                                                    type='file'
                                                    name='files'
                                                    onChange={handleFileSelect}
                                                    multiple
                                                    accept='.jpeg, .jpg, .png'
                                                    hidden
                                                    readOnly={loading}
                                                />

                                                {imagePreview.length > 0 && (
                                                    <Image
                                                        src={imagePreview}
                                                        alt={`Preview da imagem`}
                                                        quality={30}
                                                        loading='lazy'
                                                        onLoad={() => setImagePreviewLoading(false)}
                                                        fill
                                                    />
                                                )}

                                                {!loading && imagePreview.length == 0 && editMode && (
                                                    <IconifyIcon icon='fluent:add-28-regular' />
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {admin.is_super_user == 1 ||
                                (formData.id != admin.id && formData.access_level > admin.access_level) ? (
                                    <>
                                        <p></p>
                                        <GeralInput
                                            defaultValue={formData.properties_available}
                                            label='Propriedades disponíveis para cadastrar'
                                            name='properties_available'
                                            onChange={handleUserInputChange}
                                            readOnly={!(editMode && !loading)}
                                            required>
                                            <option value={999}>Ilimitado</option>

                                            {Array.from(Array(16).keys()).map((index) => (
                                                <option
                                                    key={index}
                                                    value={index}
                                                    selected={formData.properties_available == index}>
                                                    {index}
                                                </option>
                                            ))}
                                        </GeralInput>

                                        <p>Permissões</p>

                                        <div className={styles.geralRadiosWrapper}>
                                            {accessLevels.map((level, index) => (
                                                <Fragment key={index}>
                                                    <GeralInput
                                                        readOnly={!(editMode && !loading)}
                                                        variant='switch'
                                                        value={level.level}
                                                        name={`level_${index}`}
                                                        type='checkbox'
                                                        label={level.label}
                                                        on={1}
                                                        checked={formData.level.includes(level.level)}
                                                        onChange={handleUserInputChange}
                                                    />

                                                    {level.level == AccessConsts.CONTENTS && (
                                                        <GeralInput
                                                            readOnly={!(editMode && !loading)}
                                                            variant='switch'
                                                            value={1}
                                                            name={`access_ma`}
                                                            type='checkbox'
                                                            label={'Conteúdos (M.A)'}
                                                            on={1}
                                                            checked={formData.access_ma}
                                                            onChange={handleUserInputChange}
                                                        />
                                                    )}
                                                </Fragment>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <></>
                                )}
                            </div>

                            <div className={styles.mapBox}>
                                <p className={styles.propertyTitle}>Propriedades ({properties.length})</p>

                                <GeralTable
                                    headers={tablePropertyHeaders}
                                    gridColumns={`repeat(${tablePropertyHeaders.length}, 1fr)`}
                                    customClasses={[tableStyles.modalTable]}>
                                    {properties &&
                                        properties.map((property: Property, index: number) => (
                                            <TableRow
                                                key={property?.id ?? index + 1}
                                                gridColumns={`repeat(${tablePropertyHeaders.length}, 1fr)`}>
                                                <div data-type='content'>
                                                    <p title={property?.name}>{property?.name}</p>
                                                </div>

                                                <div data-type='content'>
                                                    <p title={property?.city}>{property?.city}</p>
                                                </div>

                                                <div data-type='action'>
                                                    <TableActions>
                                                        <GeralButton
                                                            variant='tertiary'
                                                            type='button'
                                                            smaller
                                                            href={`/dashboard/propriedades/${property?.id}`}
                                                            value='Ver propriedade'
                                                        />
                                                    </TableActions>
                                                </div>
                                            </TableRow>
                                        ))}
                                </GeralTable>
                            </div>
                        </div>
                    </div>
                </GeralBox>
            </motion.div>

            {showChangePasswordModal && (
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
            )}

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteUser}
                show={showDeleteUserModal}
                setShow={setShowDeleteUserModal}
                title='Excluir usuário'
            />
        </>
    )
}
