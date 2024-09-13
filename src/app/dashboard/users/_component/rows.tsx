import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import TableSelect from '@/components/tables/TableSelect'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import { ChangeEvent, useEffect, useState } from 'react'
import useSWR from 'swr'

const tableSpace = '1fr 1fr 1fr 1fr 0.6fr 1.5fr 0.6fr'

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

export default function UsersRows({ filterType }: { filterType: number | null }) {
    const { setToast } = useNotification()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)
    const { admin } = useAdmin()
    const { searchPage } = useSearch()

    const url = `/api/user/list/${admin.id}?properties=true&page=${activePage}&filter=${searchPage}&filterType=${filterType}`

    const { data, isLoading, error, mutate } = useSWR(url, getFetch)

    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
    const [deleteId, setDeleteId] = useState(0)
    const [deleteName, setDeleteName] = useState('')

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo usuário ${deleteName}`, state: 'loading' })

            await updateStatus('/api/user/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteUserModal(false)

                setToast({ text: `Usuário ${deleteName} excluído`, state: 'success' })
                mutate(url)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        mutate()
    }, [searchPage])

    const GetProperties = (properties: any) => {
        let text = ''

        properties?.forEach((property: any, index: number) => {
            if (index == 0) {
                text += property.name
                return
            }

            text += `, ${property.name}`
        })

        return text
    }

    const handleSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const { id, name, value } = e.target

        setToast({ text: `Alterando administrador(a)`, state: 'loading' })

        try {
            await updateStatus('/api/user/alter-admin', admin.id, id, value, name).then(() => {
                setToast({ text: `Admninistrador(a) atualizado(a)`, state: 'success' })
                mutate(url)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 100))
        }
    }, [data])

    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de usuários`, state: 'danger' })
            }
        }
    }, [error])

    function getAdminType(type: number) {
        switch (type) {
            case 1:
                return 'Administrador'
            case 2:
                return 'Produtor'
            case 3:
                return 'Consultor'
            case 4:
                return 'M.A'
            case 5:
                return 'Equipe'
            default:
                return 'Não definido'
        }
    }

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {data.admins &&
                data.admins.map((adminLoop: any) => (
                    <TableRow key={adminLoop.id} gridColumns={tableSpace}>
                        <div data-type='content'>
                            <p title={adminLoop.name}>{adminLoop.name}</p>
                        </div>

                        <div data-type='content'>
                            {admin.access_level == 1 ? (
                                <TableSelect
                                    defaultValue={adminLoop.access_level}
                                    itemId={adminLoop.id}
                                    options={levelOptions}
                                    name='access_level'
                                    onChange={handleSelectChange}
                                />
                            ) : (
                                getAdminType(adminLoop.access_level)
                            )}
                        </div>

                        <div data-type='content'>
                            <p title={adminLoop.email}>{adminLoop.email}</p>
                        </div>

                        <div data-type='content'>
                            <p title={adminLoop.phone}>{adminLoop.phone}</p>
                        </div>

                        <div data-type='content'>
                            {admin.access_level == 1 ? (
                                <TableSelect
                                    defaultValue={adminLoop.status}
                                    itemId={adminLoop.id}
                                    options={statusOptions}
                                    name='status'
                                    onChange={handleSelectChange}
                                />
                            ) : adminLoop.status == 1 ? (
                                'Ativo'
                            ) : (
                                'Inativo'
                            )}
                        </div>

                        <div data-type='content'>
                            <p title={GetProperties(adminLoop.all_properties)}>
                                {GetProperties(adminLoop.all_properties)}
                            </p>
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                {(admin.access_level == 1 || admin.id == adminLoop.id) && (
                                    <>
                                        <TableButton variant='see' href={`/dashboard/usuarios/${adminLoop.id}`} />
                                        <TableButton
                                            variant='edit'
                                            href={`/dashboard/usuarios/${adminLoop.id}?editing=true`}
                                        />
                                    </>
                                )}

                                {(admin.access_level == 1 || admin.id !== adminLoop.id) && data.admins.length > 1 && (
                                    <TableButton
                                        variant='delete'
                                        onClick={() => {
                                            setDeleteId(adminLoop.id)
                                            setDeleteName(adminLoop.name)
                                            setShowDeleteUserModal(!showDeleteUserModal)
                                        }}
                                    />
                                )}
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

            {!data.admins ||
                (data.admins.length == 0 && <TableRow emptyString='Nenhum usuário encontrado' columnsCount={1} />)}

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
