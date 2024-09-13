import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import getFetch from '@/utils/getFetch'
import { getStateKey, getStaticCities, getStaticStates } from '@/utils/getStaticLocation'
import { getStateKeyBolivia, getStaticStatesBolivia } from '@/utils/getStaticLocationBolivia'
import { getStateKeyParaguai, getStaticStatesParaguai } from '@/utils/getStaticLocationParaguai'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import { ChangeEvent, FC, Suspense, useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../styles.module.scss'

const tableHeaders = ['Nome', 'Tipo', 'Email', 'Telefone', 'Ramo de atividade', 'Ações']

interface InputsRowsProps {
    searchQuery?: string
    setDeleteId: any
    setShowDeleteUserModal: any
    setDeleteName: any
    setDeleteRoute: any
    setMutateRoute: any
}

interface FormData {
    admin_id: number;
    name: string;
    seller: number;
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
    corporate_name: string;
}

function InputsRows({
    searchQuery,
    setDeleteRoute,
    setDeleteId,
    setShowDeleteUserModal,
    setDeleteName,
}: InputsRowsProps) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

function InputsRows({ searchQuery, setDeleteRoute, setDeleteId, setShowDeleteUserModal, setDeleteName, setMutateRoute}: InputsRowsProps) {
    const { setToast } = useNotification();
    const { admin } = useAdmin();
    const [pageNumbers, setPageNumbers] = useState<number>(0);
    const [activePage, setActivePage] = useState<number>(1);

    const getType = (type: number) => {
        switch (type) {
            case 1:
                return 'Pessoa física'
            case 2:
                return 'Pessoa jurídica'
            default:
                return 'Sem informação'
        }
    }

    const { data, isLoading, error } = useSWR(url, getFetch)

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados dos clientes `, state: 'danger' })
            }
        }
    }, [error])

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 100))
        }
    }, [data])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {data &&
                data.clients &&
                data.clients.map((client: any, index: number) => (
                    <TableRow key={index} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content'>
                            <p title={`${client?.name}`}>{`${client?.name}`}</p>
                        </div>

                        <div data-type='content'>
                            <p title={`${getType(client.type)}`}>{`${getType(client.type)}`}</p>
                        </div>

                        <div data-type='content'>
                            <p title={client.email}>{client.email}</p>
                        </div>

                        <div data-type='content'>
                            <p title={client.phone}>{client.phone}</p>
                        </div>

                        <div data-type='content'>
                            <p title={client.branch_of_activity}>{client.branch_of_activity}</p>
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                <TableButton variant='see' href={`/dashboard/financeiro/gestao/cliente/${client.id}`} />
                                <TableButton
                                    variant='edit'
                                    href={`/dashboard/financeiro/gestao/cliente/${client.id}?editing=true`}
                                />
                                <TableButton
                                    variant='delete'
                                    onClick={() => {
                                        setMutateRoute(url);
                                        setDeleteRoute('clients');
                                        setDeleteId(client.id);
                                        setDeleteName(client.name);
                                        setShowDeleteUserModal(true);
                                    }}
                                />
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            {data.clients.length == 0 && (
                <TableRow gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                    <div
                        data-type='content'
                        style={{ gridColumn: `1/${tableHeaders.length + 1}`, textAlign: 'center' }}>
                        <p>Nenhum cliente cadastrado</p>
                    </div>
                </TableRow>
            )}

            <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

            {!data ||
                !data.exits ||
                (data.exits.length == 0 && <TableRow emptyString='Nenhuma saída encontrada' columnsCount={1} />)}
        </>
    )
}

const Suppliers: React.FC<any> = ({formModal, setFormModal, setDeleteRoute, setDeleteId, setShowDeleteUserModal, setDeleteName, setMutateRoute}) => {
    const { setToast } = useNotification();
    const { searchPage } = useSearch();
    const { admin } = useAdmin();

    const url = `/api/financial/management/clients/list/${admin.id}?filter=${searchPage}`;

    const formRef = useRef<HTMLFormElement>(null);
    const [loading, setLoading] = useState<boolean>(false)
    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        name: '',
        seller: 0,
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
        corporate_name: ''
    });

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

    const addPerson = async (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            if (formData.type == 0) {
                setToast({ text: 'Selecione um tipo', state: 'warning' })
                return
            }

            if (!loading) {
                setLoading(true)
                setToast({ text: 'Registrando cliente', state: 'loading' })

                await axios.post('/api/financial/management/clients/form', formData)

                await axios.post('/api/financial/management/clients/form', formData);

                setToast({ text: 'Cadastro realizado com sucesso', state: 'success' });
                setLoading(false);
                mutate(url);
                setFormModal(false);
            }
        } catch (error: any) {
            setLoading(false)
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    return (
        <>
            <GeralTable headers={tableHeaders} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                <Suspense fallback={<TableSkeleton />}>
                    <ErrorBoundary
                        fallbackComponent={<strong className='error-strong'>Erro crítico ao carregar a tabela</strong>}>
                        <InputsRows
                            setMutateRoute={setMutateRoute}
                            setDeleteRoute={setDeleteRoute}
                            setDeleteId={setDeleteId}
                            setDeleteName={setDeleteName}
                            setShowDeleteUserModal={setShowDeleteUserModal}
                            searchQuery={`?filter=${searchPage}`}
                        />
                    </ErrorBoundary>
                </Suspense>
            </GeralTable>

            <GeralModal show={formModal} setShow={setFormModal} title='Novo cadastro'>
                <form ref={formRef} className={styles.form} onSubmit={addPerson}>
                    <div className={`${styles.formGrid} ${styles.moreColumns}`}>
                        <GeralInput
                            required={true}
                            label='Nome'
                            name='name'
                            type='text'
                            placeholder='Digite aqui'
                            defaultValue={formData.name}
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            label='Tipo'
                            name='type'
                            type='select'
                            autoComplete='off'
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                handleUserInputChange(e)
                            }}
                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                            value={formData.type}
                            defaultValue={formData.type}
                            required
                        >
                            <option disabled value="0">Selecione a opção</option>
                            <option value="1">Pessoa física</option>
                            <option value="2">Pessoa jurídica</option>
                        </GeralInput>

                        {/* <GeralInput
                            label='Vendedor'
                            name='seller'
                            type='select'
                            autoComplete='off'
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                handleUserInputChange(e)
                            }}
                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                            value={formData.seller}
                            defaultValue={formData.seller}
                            required
                        >
                            <option disabled value="0">Selecione a opção</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                        </GeralInput> */}

                        {formData.type == 2 && (
                            <GeralInput
                                required={false}
                                label='Razão Social'
                                name='corporate_name'
                                type='text'
                                placeholder='Digite aqui'
                                defaultValue={formData.corporate_name}
                                onChange={handleUserInputChange}
                            />
                        )}

                        <GeralInput
                            required={true}
                            label='Email'
                            name='email'
                            type='email'
                            placeholder='Digite aqui'
                            defaultValue={formData.email}
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            required={true}
                            label='Telefone'
                            name='phone'
                            type='text'
                            maskVariant='phone'
                            placeholder='Digite aqui'
                            defaultValue={formData.phone}
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            defaultValue={formData.document}
                            required={true}
                            label={formData.type == 1 ? 'CPF' : 'CNPJ'}
                            maskVariant={formData.type == 1 ? 'cpf' : 'cnpj'}
                            name='document'
                            type='text'
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            required={true}
                            defaultValue={formData.state_registration}
                            label='Insc. Estadual'
                            name='state_registration'
                            type='text'
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            required={true}
                            label='Ramo de Atividade'
                            name='branch_of_activity'
                            type='text'
                            placeholder='Digite aqui'
                            defaultValue={formData.branch_of_activity}
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            required={true}
                            label='CEP'
                            name='cep'
                            type='text'
                            maskVariant='cep'
                            placeholder='Digite aqui'
                            defaultValue={formData.cep}
                            onChange={handleUserInputChange}
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
                            label='Número'
                            name='number'
                            maskVariant='integer'
                            type='text'
                            placeholder='Digite aqui'
                            defaultValue={formData.number}
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            label='Logradouro'
                            name='street'
                            type='text'
                            defaultValue={formData.street}
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            label='Complemento'
                            name='complement'
                            type='text'
                            defaultValue={formData.complement}
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            label='Referência'
                            name='reference'
                            type='text'
                            defaultValue={formData.reference}
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                        />
                    </div>

                    <div className={styles.actions}>
                        <GeralButton variant='secondary' type='submit' small disabled={loading} value='Adicionar' />

                        <GeralButton
                            variant='quaternary'
                            type='button'
                            small
                            disabled={loading}
                            value='Cancelar'
                            onClick={() => {
                                setFormModal(false)
                            }}
                        />
                    </div>
                </form>
            </GeralModal>
        </>
    )
}

export default Suppliers
