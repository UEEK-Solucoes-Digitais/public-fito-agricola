'use client'

import Admin from '@/@types/Admin'
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
import { getProductType } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { ChangeEvent, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'

interface RowDataType {
    name: string
    type?: string
    observation?: string
    admin?: Admin
    isForSeed?: number
}

interface DefensivesProps {
    toggleNewRow: boolean
    setToggleNewRow: (toggleNewRow: boolean) => void
}

const tableHeaders = ['Nome', 'Tipo de defensivo', 'Para sementes', 'Observações', 'Ações']

const selectOptions = [
    {
        value: '1',
        label: 'Adjuvante',
    },
    {
        value: '2',
        label: 'Biológico',
    },
    {
        value: '3',
        label: 'Fertilizante foliar',
    },
    {
        value: '4',
        label: 'Fungicida',
    },
    {
        value: '5',
        label: 'Herbicida',
    },
    {
        value: '6',
        label: 'Inseticida',
    },
]

const updateStatusRoute = '/api/inputs/defensives/delete'

export default function Defensives({ toggleNewRow: newRow, setToggleNewRow: setNewRow }: DefensivesProps) {
    const { setToast } = useNotification()
    const { searchPage } = useSearch()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)
    const { admin } = useAdmin()

    const { data, isLoading, error } = useSWR(
        `/api/inputs/defensives/list/${admin.id}?filter=${searchPage}&page=${activePage}`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteDefensiveModal, setShowDeleteDefensiveModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo defensivo ${deleteName}`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteDefensiveModal(false)

                setToast({ text: `Defensivo ${deleteName} excluída`, state: 'success' })
                mutate(`/api/inputs/defensives/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const handleSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const { id, value } = e.target

        setToast({ text: `Alterando situação do defensivo`, state: 'loading' })

        await updateStatus('/api/inputs/defensives/alter-type', admin.id, id, value, 'type').then(() => {
            setToast({ text: `Defensivo atualizada`, state: 'success' })
            mutate(`/api/inputs/defensives/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
        })
    }

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: any) => {
        const { name, value } = e.target

        setRowData((prevStates) => ({
            ...prevStates,
            [id]: { ...prevStates[id], [name]: value },
        }))
    }

    const confirmSubmit = (id: number) => {
        try {
            setToast({
                text: `${id == 0 ? 'Criando' : 'Atualizando'} defensivo ${rowData[id].name}`,
                state: 'loading',
            })

            axios.post('/api/inputs/defensives/form', { ...rowData[id], id, admin_id: admin.id }).then((response) => {
                if (response.status == 200) {
                    setToast({
                        text: `Defensivo ${rowData[id].name} ${id == 0 ? 'criada' : 'atualizada'}`,
                        state: 'success',
                    })

                    setRowEdit((prevStates) => ({
                        ...prevStates,
                        [id]: !prevStates[id],
                    }))

                    if (id == 0) {
                        setRowData((prevStates) => ({
                            ...prevStates,
                            0: { name: '', observation: '', isForSeed: 0, type: '1' },
                        }))

                        setNewRow(false)
                    }

                    mutate(`/api/inputs/defensives/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
                }
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
            const initialEditState: { [key: number]: boolean } = {}
            data.defensives.forEach((defensive: any) => {
                initialEditState[defensive.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            initialFormState[0] = {
                name: '',
                type: '1',
                observation: '',
                isForSeed: 0,
            }

            data.defensives.forEach((defensive: any) => {
                initialFormState[defensive.id] = {
                    name: defensive.name,
                    type: defensive.object_type,
                    observation: defensive.extra_column,
                    admin: defensive.admin,
                    isForSeed: defensive.is_for_seeds,
                }
            })
            setRowData(initialFormState)
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de defensivos`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <GeralTable headers={tableHeaders} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
            <Suspense fallback={<TableSkeleton />}>
                {newRow && (
                    <TableRow gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='name'
                                defaultValue={rowData[0]?.name}
                                readOnly={false}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                            />
                        </div>

                        <div data-type='content'>
                            <TableSelect
                                defaultValue={rowData[0]?.type ?? 1}
                                itemId={0}
                                name='type'
                                options={selectOptions}
                                onChange={(event: ChangeEvent<HTMLSelectElement>) => handleUserInputChange(event, 0)}
                            />
                        </div>

                        <div>
                            <GeralInput
                                type='checkbox'
                                label='Para sementes'
                                variant='checkbox'
                                checked={rowData[0]?.isForSeed == 1}
                                onChange={() => {
                                    setRowData((prevStates) => ({
                                        ...prevStates,
                                        0: {
                                            ...prevStates[0],
                                            isForSeed: prevStates[0].isForSeed == 1 ? 0 : 1,
                                        },
                                    }))
                                }}
                            />
                        </div>
                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='observation'
                                defaultValue={rowData[0]?.observation}
                                readOnly={false}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                            />
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                <GeralButton
                                    variant='secondary'
                                    value='Salvar'
                                    type='button'
                                    smaller
                                    onClick={() => confirmSubmit(0)}
                                />
                                <GeralButton variant='noStyle' type='button' onClick={() => setNewRow(false)}>
                                    <IconifyIcon icon='ph:x' />
                                </GeralButton>
                            </TableActions>
                        </div>
                    </TableRow>
                )}

                {data.defensives &&
                    data.defensives.map((defensive: any) => (
                        <TableRow key={defensive.id} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='name'
                                    defaultValue={rowData[defensive.id]?.name}
                                    readOnly={!rowEdit[defensive.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, defensive.id)
                                    }
                                />
                            </div>

                            <div data-type='content'>
                                {admin.access_level == 1 ? (
                                    <TableSelect
                                        defaultValue={rowData[defensive.id]?.type}
                                        itemId={defensive.id}
                                        name='type'
                                        options={selectOptions}
                                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                                            !rowEdit[defensive.id]
                                                ? handleSelectChange(event)
                                                : handleUserInputChange(event, defensive.id)
                                        }
                                    />
                                ) : (
                                    <p>{getProductType(parseInt(rowData[defensive.id]?.type as string))}</p>
                                )}
                            </div>

                            <div>
                                {rowEdit[defensive.id] ? (
                                    <GeralInput
                                        type='checkbox'
                                        label='Para sementes'
                                        variant='checkbox'
                                        checked={rowData[defensive.id]?.isForSeed == 1}
                                        onChange={() => {
                                            setRowData((prevStates) => ({
                                                ...prevStates,
                                                [defensive.id]: {
                                                    ...prevStates[defensive.id],
                                                    isForSeed: prevStates[defensive.id].isForSeed == 1 ? 0 : 1,
                                                },
                                            }))
                                        }}
                                    />
                                ) : rowData[defensive.id]?.isForSeed == 1 ? (
                                    'Sim'
                                ) : (
                                    'Não'
                                )}
                            </div>

                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='observation'
                                    defaultValue={rowData[defensive.id]?.observation}
                                    readOnly={!rowEdit[defensive.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, defensive.id)
                                    }
                                />
                            </div>

                            {/* <div>
                            {rowData[defensive.id]?.admin?.name ? rowData[defensive.id]?.admin?.name : 'Fito Agrícola'}
                        </div> */}

                            <div data-type='action'>
                                {admin.access_level == 1 && (
                                    <TableActions>
                                        {!rowEdit[defensive.id] ? (
                                            <TableButton
                                                variant='edit'
                                                onClick={() => {
                                                    setRowEdit((prevStates) => ({
                                                        ...prevStates,
                                                        [defensive.id]: !prevStates[defensive.id],
                                                    }))
                                                }}
                                            />
                                        ) : (
                                            <GeralButton
                                                variant='secondary'
                                                value='Salvar'
                                                type='button'
                                                smaller
                                                onClick={() => confirmSubmit(defensive.id)}
                                            />
                                        )}

                                        {!rowEdit[defensive.id] ? (
                                            <TableButton
                                                variant='delete'
                                                onClick={() => {
                                                    setDeleteId(defensive.id)
                                                    setDeleteName(defensive.name)
                                                    setShowDeleteDefensiveModal(!showDeleteDefensiveModal)
                                                }}
                                            />
                                        ) : (
                                            <GeralButton
                                                variant='noStyle'
                                                type='button'
                                                onClick={() => {
                                                    setRowEdit((prevStates) => ({
                                                        ...prevStates,
                                                        [defensive.id]: !prevStates[defensive.id],
                                                    }))

                                                    setRowData((prevState) => ({
                                                        ...prevState,
                                                        [defensive.id]: {
                                                            name: defensive.name,
                                                            observation: defensive.observation,
                                                            type: defensive.type,
                                                            admin: defensive.admin,
                                                        },
                                                    }))
                                                }}>
                                                <IconifyIcon icon='ph:x' />
                                            </GeralButton>
                                        )}
                                    </TableActions>
                                )}
                            </div>
                        </TableRow>
                    ))}

                {!data.defensives ||
                    (data.defensives.length == 0 && (
                        <TableRow emptyString='Nenhuma defensiva encontrada' columnsCount={1} />
                    ))}

                <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

                <GeralModal
                    small
                    isDelete
                    deleteName={deleteName}
                    deleteFunction={deleteUser}
                    show={showDeleteDefensiveModal}
                    setShow={setShowDeleteDefensiveModal}
                    title='Excluir defensivo'
                />
            </Suspense>
        </GeralTable>
    )
}
