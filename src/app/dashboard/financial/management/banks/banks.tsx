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
import WriteLog from '@/utils/logger'
import axios from 'axios'
import Image from 'next/image'
import { ChangeEvent, FC, Suspense, useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../styles.module.scss'

const tableHeaders = ['Nome', 'Ações']

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
    image: File | null
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
                setToast({ text: `Falha ao obter dados dos bancos`, state: 'danger' })
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
                data.banks &&
                data.banks.map((bank: any, index: number) => (
                    <TableRow key={index} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content'>
                            <div className={styles.bankProfile}>
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/banks/${bank.image}`}
                                    alt='Banco'
                                    className={styles.bankImage}
                                    height={25}
                                    width={25}
                                    loading='lazy'
                                />

                                <p title={`${bank?.name}`}>{`${bank?.name}`}</p>
                            </div>
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                <TableButton variant='see' href={`/dashboard/financeiro/gestao/banco/${bank.id}`} />
                                <TableButton
                                    variant='edit'
                                    href={`/dashboard/financeiro/gestao/banco/${bank.id}?editing=true`}
                                />
                                <TableButton
                                    variant='delete'
                                    onClick={() => {
                                        setMutateRoute(url);
                                        setDeleteRoute('banks')
                                        setDeleteId(bank.id)
                                        setDeleteName(bank.name)
                                        setShowDeleteUserModal(true)
                                    }}
                                />
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            {data.banks.length == 0 && (
                <TableRow gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                    <div
                        data-type='content'
                        style={{ gridColumn: `1/${tableHeaders.length + 1}`, textAlign: 'center' }}>
                        <p>Nenhum banco cadastrado</p>
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

const Bank: React.FC<any> = ({formModal, setFormModal, setDeleteRoute, setDeleteId, setShowDeleteUserModal, setDeleteName, setMutateRoute}) => {
    const { setToast } = useNotification();
    const {searchPage} = useSearch();
    const { admin } = useAdmin();

    const url = `/api/financial/management/banks/list/${admin.id}?filter=${searchPage}`;

    const formRef = useRef<HTMLFormElement>(null);
    const [loading, setLoading] = useState<boolean>(false)
    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        name: '',
        image: null,
    })

    const addPerson = async (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            if (formData.image == null) {
                setToast({ text: 'Insira uma imagem', state: 'warning' })
                return
            }

            if (!loading) {
                setLoading(true)
                setToast({ text: 'Registrando banco', state: 'loading' })

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

        if (name == 'image' && files) {
            setFormData((prevData) => ({ ...prevData, [name]: files ? files[0] : null }))
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
                    <div className={styles.formGridBank}>
                        <GeralInput
                            label='Nome'
                            name='name'
                            type='text'
                            placeholder='Digite aqui'
                            onChange={handleUserInputChange}
                            defaultValue={formData.name}
                        />

                        <GeralInput
                            label='Logo do banco (100x100px)'
                            name='image'
                            type='file'
                            placeholder='Digite aqui'
                            fileName={formData.image ? formData.image?.name : 'Selecione um arquivo'}
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

export default Bank
