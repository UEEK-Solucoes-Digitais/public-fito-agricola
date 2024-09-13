'use client'

import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import TableHeader from '@/components/tables/TableHeader'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import useSetupAddButton from '@/hooks/addButtonHook'
import { getStateKey, getStaticCities, getStaticStates } from '@/utils/getStaticLocation'
import { getStateKeyBolivia, getStaticStatesBolivia } from '@/utils/getStaticLocationBolivia'
import { getStateKeyParaguai, getStaticStatesParaguai } from '@/utils/getStaticLocationParaguai'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import { ChangeEvent, FormEvent, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import UsersRows from './_component/rows'
import styles from './styles.module.scss'

const tableHeaders = ['Nome', 'Tipo', 'Email', 'Telefone', 'Situação', 'Propriedades', 'Ações']
const tableSpace = '1fr 1fr 1fr 1fr 0.6fr 1.5fr 0.6fr'

interface FormData {
    admin_id: number
    name: string
    email: string
    password?: string
    password_confirm?: string
    phone: string
    access_level: number
    properties_available: number
    state: string
    city: string
    country: string
}

export default function Users() {
    const { admin } = useAdmin()
    const { setToast } = useNotification()
    const [showNewUserModal, setShowNewUserModal] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        name: '',
        email: '',
        phone: '',
        access_level: 0,
        properties_available: 999,
        state: '',
        city: '',
        country: '',
    })

    const [filterType, setFilterType] = useState<number | null>(null)
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

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    const addUser = useCallback(
        async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            try {
                setLoading(true)

                if (formData.password && formData.password !== formData.password_confirm) {
                    setToast({ text: 'As senhas devem ser iguais', state: 'warning' })
                    return
                }

                setToast({ text: 'Adicionando usuário', state: 'loading' })

                await axios
                    .post('/api/user/add', formData)
                    .then((response: any) => {
                        if (response.data.status == 200) {
                            setToast({ text: response.data.msg, state: 'success' })
                            // mutate(`/api/user/list/${admin.id}`);
                            setShowNewUserModal(false)
                        } else {
                            setToast({ text: response.data.msg, state: 'danger' })
                        }
                    })
                    .catch((error) => {
                        throw error
                    })
            } catch (error: any) {
                WriteLog(error, 'error')
                const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                setToast({ text: message, state: 'danger' })
            } finally {
                setLoading(false)
            }
        },
        [formData, setToast],
    )

    const toggleModal = useCallback(() => {
        setShowNewUserModal((prev) => !prev)
    }, [])

    useEffect(() => {
        if (!showNewUserModal && formRef?.current) {
            formRef.current.reset()
        }
    }, [showNewUserModal])

    if (admin.access_level == 1) {
        useSetupAddButton(toggleModal)
    }

    return (
        <>
            <TableHeader
                title='Usuários'
                description='Adicione novos usuários clicando no botão acima à direita.'
                buttonActionName={admin.access_level == 1 ? `Adicionar usuário` : ''}
                onButtonAction={
                    admin.access_level == 1
                        ? () => {
                              setShowNewUserModal(!showNewUserModal)
                          }
                        : undefined
                }
                filter={admin.access_level == 1}>
                {admin.access_level == 1 && (
                    <GeralInput
                        label='Nível de usuário'
                        name='filterType'
                        type='select'
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setFilterType(parseInt(e.target.value))
                        }}
                        required>
                        <option value={0}>Selecione</option>
                        <option value={1}>Administrador</option>
                        <option value={2}>Produtor</option>
                        <option value={3}>Consultor</option>
                        <option value={4}>M.A</option>
                        <option value={5}>Equipe</option>
                    </GeralInput>
                )}
            </TableHeader>

            <GeralTable headers={tableHeaders} gridColumns={tableSpace}>
                <Suspense fallback={<TableSkeleton />}>
                    <UsersRows filterType={filterType} />
                </Suspense>
            </GeralTable>

            <GeralModal show={showNewUserModal} setShow={setShowNewUserModal} title='Novo usuário' loading={loading}>
                <form ref={formRef} className={styles.addUserForm} onSubmit={addUser}>
                    <div className={styles.formGrid}>
                        <GeralInput
                            label='Nome'
                            name='name'
                            type='text'
                            placeholder='Digite o nome'
                            onChange={handleUserInputChange}
                            readOnly={loading}
                            required
                        />
                        <GeralInput
                            label='Email'
                            name='email'
                            type='text'
                            placeholder='Digite o email'
                            onChange={handleUserInputChange}
                            readOnly={loading}
                            required
                        />
                        <GeralInput
                            defaultValue={formData.country}
                            label='País'
                            name='country'
                            type='select'
                            placeholder='Selecione o País'
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                handleUserInputChange(e)
                                updateStates(e)
                            }}
                            readOnly={loading}
                            required>
                            <option disabled value=''>
                                Selecione
                            </option>
                            <option value='Brasil'>Brasil</option>
                            <option value='Paraguai'>Paraguai</option>
                            <option value='Bolívia'>Bolívia</option>
                        </GeralInput>
                        <GeralInput
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
                        {formData.country == 'Brasil' && (
                            <GeralInput
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
                            label='Telefone'
                            name='phone'
                            type='text'
                            placeholder='00 00000-0000'
                            maskVariant='phone'
                            maxLength={15}
                            onChange={handleUserInputChange}
                            readOnly={loading}
                            required
                        />

                        <GeralInput
                            label='Senha'
                            name='password'
                            type='password'
                            placeholder='Digite sua senha'
                            onChange={handleUserInputChange}
                            readOnly={loading}
                        />
                        <GeralInput
                            label='Confirme sua senha'
                            name='password_confirm'
                            type='password'
                            placeholder='Digite sua senha novamente'
                            onChange={handleUserInputChange}
                            readOnly={loading}
                        />
                        <GeralInput
                            defaultValue={formData.access_level}
                            label='Tipo de usuário'
                            name='access_level'
                            onChange={handleUserInputChange}
                            readOnly={loading}
                            required>
                            <option value={0} disabled>
                                Selecione
                            </option>
                            <option value={1}>Administrador</option>
                            <option value={3}>Consultor</option>
                            <option value={4}>M.A</option>
                            <option value={5}>Equipe</option>
                            <option value={2}>Produtor</option>
                        </GeralInput>
                        <GeralInput
                            defaultValue={formData.properties_available}
                            label='Propriedades para cadastro'
                            name='properties_available'
                            onChange={handleUserInputChange}
                            readOnly={loading}
                            required>
                            <option value={999}>Ilimitado</option>

                            {Array.from(Array(16).keys()).map((index) => (
                                <option key={index} value={index}>
                                    {index}
                                </option>
                            ))}
                        </GeralInput>
                    </div>

                    <div className={styles.actions}>
                        <GeralButton variant='secondary' type='submit' small value='Adicionar' disabled={loading} />
                        <GeralButton
                            variant='quaternary'
                            type='button'
                            small
                            value='Cancelar'
                            disabled={loading}
                            onClick={() => {
                                setShowNewUserModal(false)
                            }}
                        />
                    </div>
                </form>
            </GeralModal>
        </>
    )
}
