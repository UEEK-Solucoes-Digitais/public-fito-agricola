import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import TableSelect from '@/components/tables/TableSelect'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import getFetch from '@/utils/getFetch'
import { getStateKey, getStaticCities, getStaticStates } from '@/utils/getStaticLocation'
import { getStateKeyBolivia, getStaticStatesBolivia } from '@/utils/getStaticLocationBolivia'
import { getStateKeyParaguai, getStaticStatesParaguai } from '@/utils/getStaticLocationParaguai'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { ChangeEvent, FC, Suspense, useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../styles.module.scss'

const tableHeaders = ['Nome', 'Tipo', 'CNPJ/CPF', 'Email', 'Telefone', 'Ações']
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
interface InputsRowsProps {
    searchQuery?: string
    setDeleteId: any
    setShowDeleteUserModal: any
    setDeleteName: any
    setDeleteRoute: any,
    setMutateRoute: any,
    setBanks: (banks: any) => void;
    setAccounts: (accounts: any) => void;

}

interface FormData {
    admin_id: number;
    name: string;
    corporate_name: string;
    email: string;
    phone: string;
    type: number;
    document: string;
    state_registration: string;
    branch_of_activity: string;
    cep: string;
    state: string;
    country: string;
    city: string;
    number: number;
    street: string;
    complement: string;
    reference: string;
    new_account: boolean;
    account_id: number;
    bank_id: number;
    account_type: number;
    agency: string;
    account: string;
    start_balance: string;
    start_date: string;
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

function InputsRows({ searchQuery, setDeleteRoute, setDeleteId, setShowDeleteUserModal, setDeleteName, setBanks, setAccounts, setMutateRoute}: InputsRowsProps) {
    const { setToast } = useNotification();
    const { admin } = useAdmin();
    const [pageNumbers, setPageNumbers] = useState<number>(0);
    const [activePage, setActivePage] = useState<number>(1);

    const handleSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const { id, name, value } = e.target

        setToast({ text: `Alterando fornecedor(a)`, state: 'loading' })

        try {
            await updateStatus('/api/financial/management/suppliers/alter-type', admin.id, id, value, name).then(() => {
                setToast({ text: `Fornecedor(a) atualizado(a)`, state: 'success' })
                mutate(url)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    // const getType = (type: number) => {
    //     switch(type){
    //         case 1:
    //             return 'Funcionário';
    //         case 2:
    //             return 'Terceiro';
    //         default:
    //             return 'Sem informação';
    //     }
    // };

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
                setToast({ text: `Falha ao obter dados dos fornecedores `, state: 'danger' })
            }
        }
    }, [error])

    useEffect(() => {
        if (data) {
            const total = data.total;
            setPageNumbers(Math.ceil(total / 100));

            if (data.banks) {
                setBanks(data.banks);
            }

            if(data.accounts){
                setAccounts(data.accounts);
            }
        }
    }, [data])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {data &&
                data.suppliers &&
                data.suppliers.map((supplier: any, index: number) => (
                    <TableRow key={index} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content'>
                            <p title={`${supplier?.name}`}>{`${supplier?.name}`}</p>
                        </div>

                        <div data-type='content'>
                            <TableSelect
                                defaultValue={supplier.type}
                                itemId={supplier.id}
                                options={typeOptions}
                                name='type'
                                onChange={handleSelectChange}
                            />
                        </div>

                        <div data-type='content'>
                            <p title={`${supplier.document}`}>{`${supplier.document}`}</p>
                        </div>

                        <div data-type='content'>
                            <p title={supplier.email}>{supplier.email}</p>
                        </div>

                        <div data-type='content'>
                            <p title={supplier.phone}>{supplier.phone}</p>
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                <TableButton
                                    variant='see'
                                    href={`/dashboard/financeiro/gestao/fornecedor/${supplier.id}`}
                                />
                                <TableButton
                                    variant='edit'
                                    href={`/dashboard/financeiro/gestao/fornecedor/${supplier.id}?editing=true`}
                                />
                                <TableButton
                                    variant='delete'
                                    onClick={() => {
                                        setDeleteRoute('suppliers');
                                        setMutateRoute(url);
                                        setDeleteId(supplier.id);
                                        setDeleteName(supplier.name);
                                        setShowDeleteUserModal(true);
                                    }}
                                />
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            {
                data.suppliers.length == 0 && (
                    <TableRow gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content' style={{ gridColumn: `1/${tableHeaders.length + 1}`, textAlign: 'center' }}>
                            <p>Nenhum fornecedor cadastrado</p>
                        </div>
                    </TableRow>
                )
            }

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

    const url = `/api/financial/management/suppliers/list/${admin.id}?filter=${searchPage}`;

    const formRef = useRef<HTMLFormElement>(null);
    const [loading, setLoading] = useState<boolean>(false)
    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        name: '',
        corporate_name: '',
        email: '',
        phone: '',
        type: 0,
        document: '',
        state_registration: '',
        branch_of_activity: '',
        cep: '',
        state: '',
        country: '',
        city: '',
        number: 0,
        street: '',
        complement: '',
        reference: '',
        bank_id: 0,
        new_account: true,
        account_id: 0,
        agency: '',
        account: '',
        account_type: 0,
        start_date: '',
        start_balance: '',
    });

    const [banks, setBanks] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);


    const [stateId, setStateId] = useState<string | number | null>(null);
    const states = getStaticStates();
    const statesParaguai = getStaticStatesParaguai();
    const statesBolivia = getStaticStatesBolivia();
    const [statesToUse, setStatesToUse] = useState<any>(states);
    const cities = getStaticCities(stateId);

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
            
            if (formData.document === '' || formData.document.length < 11) {
                setToast({ text: 'Insira um CPF/CNPJ válido', state: 'warning' });
                return;
            }

            if (!loading) {
                setLoading(true)
                setToast({ text: 'Registrando fornecedor', state: 'loading' })

                // const body = new FormData();
                // for(let [key, value] of Object.entries(formData)){
                //     if(value){
                //         if(key != 'file'){
                //             value = value.toString();
                //         }

                //         body.append(key, value);
                //     }
                // }
                // body.append('pathToUpload', 'people');

                await axios.post('/api/financial/management/suppliers/form', formData)

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
        const { name, value } = e.target;
        console.log('LOOOG',name, value);
        if(name === 'new_account' && 'checked' in e.target){
            const { checked } = e.target;
            setFormData((prevData) => ({ ...prevData, [name]: !checked }));
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }

    };

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
                            setBanks={setBanks}
                            setAccounts={setAccounts}

                        />
                    </ErrorBoundary>
                </Suspense>
            </GeralTable>

            <GeralModal show={formModal} setShow={setFormModal} title='Novo cadastro'>
                <form ref={formRef} className={styles.form} onSubmit={addPerson}>
                    <div className={styles.gridWrapper}>
                        <span className={styles.gridLabel}>Informações gerais</span>

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
                                defaultValue={formData.type}
                                // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                value={formData.type}
                                required>
                                <option disabled value='0'>
                                    Selecione a opção
                                </option>
                                <option value='1'>Pessoa física</option>
                                <option value='2'>Pessoa jurídica</option>
                            </GeralInput>

                            {formData.type == 2 && (
                                <GeralInput
                                    required={false}
                                    label='Razão Social'
                                    name='corporate_name'
                                    type='text'
                                    defaultValue={formData.corporate_name}
                                    placeholder='Digite aqui'
                                    onChange={handleUserInputChange}
                                />
                            )}

                            <GeralInput
                                required={true}
                                label='Email'
                                name='email'
                                type='email'
                                placeholder='Digite aqui'
                                onChange={handleUserInputChange}
                            />

                            <GeralInput
                                autoComplete='off'
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
                                autoComplete='off'
                                required={true}
                                label={formData.type == 1 ? 'CPF' : 'CNPJ'}
                                maskVariant={formData.type == 1 ? 'cpf' : 'cnpj'}
                                name='document'
                                type='text'
                                placeholder='Digite aqui'
                                defaultValue={formData.document}
                                onChange={handleUserInputChange}
                            />

                            <GeralInput
                                required={true}
                                label='Insc. Estadual'
                                name='state_registration'
                                type='text'
                                placeholder='Digite aqui'
                                defaultValue={formData.state_registration}
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
                        </div>
                    </div>

                    <div className={styles.gridWrapper}>
                        <span className={styles.gridLabel}>Localização</span>

                        <div className={`${styles.formGrid} ${styles.moreColumns}`}>
                            {/* TODO: Integração VIACEP */}
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
                                readOnly={loading}>
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
                                }}>
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
                                    required={false}
                                    defaultValue={formData.city}
                                    label='Município'
                                    name='city'
                                    type='select'
                                    onChange={handleUserInputChange}>
                                    <option disabled value=''>
                                        Selecione
                                    </option>

                                    <GeralInput
                                        defaultValue={formData.city}
                                        label='Município'
                                        name='city'
                                        type='select'
                                        onChange={handleUserInputChange}
                                        >
                                        <option disabled value=''>
                                            Selecione
                                        </option>

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
                                placeholder='Digite aqui'
                                defaultValue={formData.reference}
                                onChange={handleUserInputChange}
                            />
                        </div>
                    </div>

                    <div className={styles.gridWrapper}>
                        <span className={styles.gridLabel}>
                            Dados bancários
                        </span>

                        <div className={styles.radioWrapper}>
                            <GeralInput
                                variant='switch'
                                value='1'
                                name='new_account'
                                type='checkbox'
                                label='Conta bancária ja existente'
                                on={1}
                                defaultChecked={true}
                                onChange={handleUserInputChange}
                            />
                        </div>

                        <div className={`${styles.formGrid} ${styles.moreColumns}`}>

                            {!formData.new_account && 
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
                                        accounts.map((account) => (
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

                            {formData.new_account && 
                                <>
                                    <GeralInput
                                        label='Banco'
                                        name='bank_id'
                                        type='select'
                                        placeholder='Digite aqui'
                                        defaultValue={formData.bank_id}
                                        onChange={handleUserInputChange}
                                    >
                                        <option value="0">Selecione o banco</option>

                                        {
                                            banks.map((bank) => (
                                                <option key={`bank-${bank.id}`} value={bank.id}>
                                                    <div className={styles.bankProfile}>
                                                        <img src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/banks/${bank.image}`} alt="Banco" className={styles.bankImage} />
                                                        <p
                                                            title={`${bank?.name}`}>
                                                            {`${bank?.name}`}
                                                        </p>
                                                    </div>
                                                </option>
                                            ))
                                        }
                                    </GeralInput>

                                    <GeralInput
                                        label='Agência'
                                        name='agency'
                                        type='text'
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.agency}
                                        required
                                    />

                                    <GeralInput
                                        label='Número da conta'
                                        name='account'
                                        type='text'
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.account}
                                        maxLength={11}
                                        required
                                    />

                                    <GeralInput
                                        label='Tipo'
                                        name='account_type'
                                        type='select'
                                        autoComplete='off'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.account_type}
                                        required
                                    >
                                        <option disabled value="0">Selecione a opção</option>
                                        <option value="1">Conta corrente</option>
                                        <option value="2">Conta poupança</option>
                                    </GeralInput>

                                    <GeralInput
                                        label='Data de Abertura'
                                        name='start_date'
                                        type='date'
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.start_date}
                                        required
                                    />

                                    <GeralInput
                                        label='Saldo de Abertura'
                                        name='start_balance'
                                        type='text'
                                        maskVariant="price"
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                        defaultValue={formData.start_balance}
                                        required
                                    />
                                </>
                            }

                        </div>
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
