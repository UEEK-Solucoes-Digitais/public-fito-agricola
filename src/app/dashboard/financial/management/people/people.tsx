import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
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
import Link from 'next/link'
import { ChangeEvent, FC, Suspense, useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../styles.module.scss'

const tableHeaders = ['Nome', 'Tipo', 'Email', 'Telefone', 'Situação', 'Contrato', 'Ações']
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
}

interface FormData {
    admin_id: number
    name: string
    email: string
    type: number
    phone: string
    status: number
    file: File | null
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

    const url = `/api/financial/management/people/list/${admin.id}${searchQuery}`;

    const { data, isLoading, error } = useSWR(
        url,
        getFetch,
        {
            suspense: true,
        },
    );

    const handleSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const { id, name, value } = e.target

        setToast({ text: `Alterando pessoa`, state: 'loading' })

        try {
            await updateStatus('/api/financial/management/people/alter-status', admin.id, id, value, name)
            mutate(url);
            setToast({ text: `Pessoa atualizado(a)`, state: 'success' });

        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const getType = (type: number) => {
        switch (type) {
            case 1:
                return 'Funcionário'
            case 2:
                return 'Terceiro'
            default:
                return 'Sem informação'
        }
    }

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
                setToast({ text: `Falha ao obter dados das pessoas`, state: 'danger' })
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
                data.people &&
                data.people.map((person: any, index: number) => (
                    <TableRow key={index} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content'>
                            <p title={`${person?.name}`}>{`${person?.name}`}</p>
                        </div>

                        <div data-type='content'>
                            <p title={getType(person.type)}>{getType(person.type)}</p>
                        </div>

                        <div data-type='content'>
                            <p title={`${person.email}`}>{`${person.email}`}</p>
                        </div>

                        <div data-type='content'>
                            <p title={person.phone}>{person.phone}</p>
                        </div>

                        <div data-type='content'>
                            <TableSelect
                                defaultValue={person.status}
                                itemId={person.id}
                                options={statusOptions}
                                name='status'
                                onChange={handleSelectChange}
                            />
                        </div>

                        <div data-type='content'>
                            <p className={styles.contractLink} title={'Contrato'}>
                                {person.file ? (
                                    <Link
                                        className={styles.active}
                                        target='_blank'
                                        href={`${process.env.NEXT_PUBLIC_IMAGE_URL}/people/${person.file}`}
                                        rel='noreferrer'>
                                        <IconifyIcon icon='ph:eye' />
                                        {person.file}
                                    </Link>
                                ) : (
                                    <div className={styles.inactive}>
                                        <IconifyIcon icon='ph:eye' />
                                        Indisponível
                                    </div>
                                )}
                            </p>
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                <TableButton variant='see' href={`/dashboard/financeiro/gestao/pessoa/${person.id}`} />
                                <TableButton
                                    variant='edit'
                                    href={`/dashboard/financeiro/gestao/pessoa/${person.id}?editing=true`}
                                />
                                <TableButton
                                    variant='delete'
                                    onClick={() => {
                                        setDeleteRoute('people');
                                        setMutateRoute(url);
                                        setDeleteId(person.id);
                                        setDeleteName(person.name);
                                        setShowDeleteUserModal(true);
                                    }}
                                />
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            {data.people.length == 0 && (
                <TableRow gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                    <div
                        data-type='content'
                        style={{ gridColumn: `1/${tableHeaders.length + 1}`, textAlign: 'center' }}>
                        <p>Nenhuma pessoa cadastrada</p>
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

const People: React.FC<any> = ({formModal, setFormModal, setDeleteRoute, setDeleteId, setShowDeleteUserModal, setDeleteName, setMutateRoute}) => {
    const { setToast } = useNotification();
    const {searchPage} = useSearch();
    const { admin } = useAdmin();

    const url = `/api/financial/management/people/list/${admin.id}?filter=${searchPage}`;
    
    const formRef = useRef<HTMLFormElement>(null);
    const [loading, setLoading] = useState<boolean>(false)
    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        name: '',
        email: '',
        type: 0,
        phone: '',
        status: 1,
        file: null,
    })

    const addPerson = async (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            if (formData.type === 0) {
                setToast({ text: 'Selecione um tipo', state: 'warning' });
                return;
            }

            if (formData.status == 0) {
                setToast({ text: 'Selecione uma situação', state: 'warning' })
                return
            }

            if (!loading) {
                setLoading(true)
                setToast({ text: 'Registrando pessoa', state: 'loading' })

                const body = new FormData()
                for (let [key, value] of Object.entries(formData)) {
                    if (value) {
                        if (key != 'file') {
                            value = value.toString()
                        }

                        body.append(key, value)
                    }
                }
                body.append('pathToUpload', 'people');
                body.append('noEncoding', 'true');

                await axios.post('/api/financial/management/people/form', body)

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
                    <div className={styles.formGrid}>
                        <GeralInput
                            label='Nome'
                            name='name'
                            type='text'
                            defaultValue={formData.name}
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                        />

                        <GeralInput
                            label='Email'
                            name='email'
                            type='email'
                            defaultValue={formData.email}
                            placeholder='Digite aqui'
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
                            defaultValue={formData.type}
                            value={formData.type}
                            required>
                            <option disabled value='0'>
                                Selecione a opção
                            </option>
                            <option value='1'>Funcionário</option>
                            <option value='2'>Terceiro</option>
                        </GeralInput>

                        <GeralInput
                            label='Telefone'
                            name='phone'
                            maskVariant='phone'
                            type='text'
                            defaultValue={formData.phone}
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
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
                            value={formData.status}
                            required>
                            <option disabled value='0'>
                                Selecione a opção
                            </option>
                            <option value='1'>Ativo</option>
                            <option value='2'>Inativo</option>
                        </GeralInput>

                        <div></div>

                        <GeralInput
                            label='Contrato'
                            name='file'
                            type='file'
                            placeholder='Digite aqui'
                            fileName={formData.file?.name}
                            onChange={handleUserInputChange}
                            isContractFile={true}
                            additionalArgs={{
                                fileTypeName: 'contrato',
                                fileSize: formData.file?.size.toString() ?? '',
                                createMode: true,
                            }}
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

export default People
