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
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import Image from 'next/image'
import { ChangeEvent, Suspense, useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../styles.module.scss'

const tableHeaders = ['Banco', 'Tipo', 'Agência', 'Número', 'Situação', 'Ações']
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
interface InputsRowsProps {
    searchQuery?: string
    setDeleteId: any
    setShowDeleteUserModal: any
    setDeleteName: any
    setDeleteRoute: any
    setMutateRoute: any
    setBanks: (banks: any) => void;
}

interface FormData {
    admin_id: number
    type: number
    bank_id: number
    agency: string
    account: string
    start_balance: string
    start_date: string
    status: number
}

function InputsRows({
    searchQuery,
    setDeleteRoute,
    setDeleteId,
    setShowDeleteUserModal,
    setDeleteName,
    setBanks,
}: InputsRowsProps) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

function InputsRows({ searchQuery, setDeleteRoute, setDeleteId, setShowDeleteUserModal, setDeleteName, setBanks, setMutateRoute}: InputsRowsProps) {
    const { setToast } = useNotification();
    const { admin } = useAdmin();
    const [pageNumbers, setPageNumbers] = useState<number>(0);
    const [activePage, setActivePage] = useState<number>(1);

    const handleSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const { id, name, value } = e.target

        setToast({ text: `Alterando conta`, state: 'loading' })

        try {
            await updateStatus('/api/financial/management/accounts/alter-status', admin.id, id, value, name).then(
                () => {
                    setToast({ text: `Conta atualizada`, state: 'success' })
                    mutate(url)
                },
            )
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const getType = (type: number) => {
        switch (type) {
            case 1:
                return 'Conta corrente'
            case 2:
                return 'Conta poupoança'
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
                setToast({ text: `Falha ao obter dados das contas bancárias `, state: 'danger' })
            }
        }
    }, [error])

    useEffect(() => {
        if (data) {
            const total = data.total;
            setPageNumbers(Math.ceil(total / 100));

            if (data.banks) {
                setBanks(data.banks)
            }
        }
    }, [data])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {data &&
                data.accounts &&
                data.accounts.map((account: any, index: number) => (
                    <TableRow key={index} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content'>
                            <div className={styles.bankProfile}>
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/banks/${account?.bank.image}`}
                                    alt='Banco'
                                    className={styles.bankImage}
                                    height={25}
                                    width={25}
                                    loading='lazy'
                                />

                                <p title={`${account?.bank.name}`}>{`${account?.bank.name}`}</p>
                            </div>
                        </div>

                        <div data-type='content'>
                            <p title={`${getType(account.type)}`}>{`${getType(account.type)}`}</p>
                        </div>

                        <div data-type='content'>
                            <p title={account.agency}>{account.agency}</p>
                        </div>

                        <div data-type='content'>
                            <p title={account.account}>{account.account}</p>
                        </div>

                        <div data-type='content'>
                            <TableSelect
                                defaultValue={account.status}
                                itemId={account.id}
                                options={statusOptions}
                                name='status'
                                onChange={handleSelectChange}
                            />
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                <TableButton variant='see' href={`/dashboard/financeiro/gestao/conta/${account.id}`} />
                                <TableButton
                                    variant='edit'
                                    href={`/dashboard/financeiro/gestao/conta/${account.id}?editing=true`}
                                />
                                <TableButton
                                    variant='delete'
                                    onClick={() => {
                                        setMutateRoute(url);
                                        setDeleteRoute('accounts');
                                        setDeleteId(account.id);
                                        setDeleteName(account.name);
                                        setShowDeleteUserModal(true);
                                    }}
                                />
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            {data.accounts.length == 0 && (
                <TableRow gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                    <div
                        data-type='content'
                        style={{ gridColumn: `1/${tableHeaders.length + 1}`, textAlign: 'center' }}>
                        <p>Nenhuma conta cadastrado</p>
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

const Accounts: React.FC<any> = ({ formModal, setFormModal, setDeleteRoute, setDeleteId, setShowDeleteUserModal, setDeleteName, setMutateRoute }) => {
    const { setToast } = useNotification();
    const {searchPage} = useSearch();
    const { admin } = useAdmin();

    const url = `/api/financial/management/accounts/list/${admin.id}?filter=${searchPage}`;

    const formRef = useRef<HTMLFormElement>(null);
    const [loading, setLoading] = useState<boolean>(false)
    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        type: 0,
        bank_id: 0,
        agency: '',
        account: '',
        start_balance: '',
        start_date: '',
        status: 0,
    })

    const [banks, setBanks] = useState<any[]>([])

    const addPerson = async (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            if (formData.type == 0) {
                setToast({ text: 'Selecione um tipo', state: 'warning' })
                return
            }

            if (formData.bank_id == 0) {
                setToast({ text: 'Selecione um banco', state: 'warning' })
                return
            }

            if (!loading) {
                setLoading(true)
                setToast({ text: 'Registrando conta bancária', state: 'loading' })

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

                await axios.post('/api/financial/management/accounts/form', formData)

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
                            setBanks={setBanks}
                        />
                    </ErrorBoundary>
                </Suspense>
            </GeralTable>

            <GeralModal show={formModal} setShow={setFormModal} title='Novo cadastro'>
                <form ref={formRef} className={styles.form} onSubmit={addPerson}>
                    <div className={styles.formGrid}>
                        <GeralInput
                            label='Banco/Operadora'
                            name='bank_id'
                            type='select'
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                            defaultValue={formData.bank_id}>
                            <option value='0'>Selecione o banco</option>

                            {banks.map((bank) => (
                                <option key={`bank-${bank.id}`} value={bank.id}>
                                    {bank.name}
                                </option>
                            ))}
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
                            maxLength={11}
                            defaultValue={formData.account}
                            required
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
                            defaultValue={formData.type}
                            required>
                            <option disabled value='0'>
                                Selecione a opção
                            </option>
                            <option value='1'>Conta corrente</option>
                            <option value='2'>Conta poupança</option>
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
                            maskVariant='price'
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                            defaultValue={formData.start_balance}
                            required
                        />

                        <GeralInput
                            label='Situação'
                            name='status'
                            type='select'
                            autoComplete='off'
                            defaultValue={formData.status}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                handleUserInputChange(e)
                            }}
                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                            required>
                            <option disabled value='0'>
                                Selecione a opção
                            </option>
                            <option value='1'>Ativo</option>
                            <option value='2'>Inativo</option>
                        </GeralInput>
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
