'use client'

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
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { ChangeEvent, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'

interface RowDataType {
    name: string
    scientific_name: string
    observation?: string
    type?: string
}

interface WeedsProps {
    toggleNewRow: boolean
    setToggleNewRow: (toggleNewRow: boolean) => void
}

const tableHeaders = ['Nome', 'Nome Científico', 'Observações', 'Ações']
const updateStatusRoute = '/api/interference-factors/delete'

export default function Weeds({ toggleNewRow: newRow, setToggleNewRow: setNewRow }: WeedsProps) {
    const { setToast } = useNotification()
    const { searchPage } = useSearch()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    const { data, isLoading, error } = useSWR(
        `/api/interference-factors/list/1?filter=${searchPage}&page=${activePage}`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteWeedModal, setShowDeleteWeedModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})
    const { admin } = useAdmin()

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo daninha ${deleteName}`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteWeedModal(false)

                setToast({ text: `Cultura ${deleteName} excluída`, state: 'success' })
                mutate(`/api/interference-factors/list/1?filter=${searchPage}&page=${activePage}`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
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
                text: `${id == 0 ? 'Criando' : 'Atualizando'} daninha ${rowData[id].name}`,
                state: 'loading',
            })

            axios
                .post('/api/interference-factors/form', { ...rowData[id], id, admin_id: admin.id })
                .then((response) => {
                    if (response.status == 200) {
                        setToast({
                            text: `Cultura ${rowData[id].name} ${id == 0 ? 'criada' : 'atualizada'}`,
                            state: 'success',
                        })

                        setRowEdit((prevStates) => ({
                            ...prevStates,
                            [id]: !prevStates[id],
                        }))

                        if (id == 0) {
                            setRowData((prevStates) => ({
                                ...prevStates,
                                0: { name: '', scientific_name: '' },
                            }))

                            setNewRow(false)
                        }

                        mutate(`/api/interference-factors/list/1?filter=${searchPage}&page=${activePage}`)
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
            setPageNumbers(Math.ceil(total / 10))
            const initialEditState: { [key: number]: boolean } = {}
            data.interference_factors_items.forEach((weed: any) => {
                initialEditState[weed.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            initialFormState[0] = {
                name: '',
                scientific_name: '',
                observation: '',
                type: '1',
            }

            data.interference_factors_items.forEach((weed: any) => {
                initialFormState[weed.id] = {
                    name: weed.name,
                    scientific_name: weed.scientific_name,
                    observation: weed.observation,
                    type: weed.type,
                }
            })
            setRowData(initialFormState)
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de daninhas`, state: 'danger' })
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
                            <GeralInput
                                variant='inline'
                                name='scientific_name'
                                defaultValue={rowData[0]?.scientific_name}
                                readOnly={false}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
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

                {data.interference_factors_items &&
                    data.interference_factors_items.map((weed: any) => (
                        <TableRow key={weed.id} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='name'
                                    defaultValue={rowData[weed.id]?.name}
                                    readOnly={!rowEdit[weed.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, weed.id)
                                    }
                                />
                            </div>

                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='scientific_name'
                                    defaultValue={rowData[weed.id]?.scientific_name}
                                    readOnly={!rowEdit[weed.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, weed.id)
                                    }
                                />
                            </div>

                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='observation'
                                    defaultValue={rowData[weed.id]?.observation}
                                    readOnly={!rowEdit[weed.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, weed.id)
                                    }
                                />
                            </div>

                            <div data-type='action'>
                                {admin.access_level == 1 && (
                                    <TableActions>
                                        {!rowEdit[weed.id] ? (
                                            <TableButton
                                                variant='edit'
                                                onClick={() => {
                                                    setRowEdit((prevStates) => ({
                                                        ...prevStates,
                                                        [weed.id]: !prevStates[weed.id],
                                                    }))
                                                }}
                                            />
                                        ) : (
                                            <GeralButton
                                                variant='secondary'
                                                value='Salvar'
                                                type='button'
                                                smaller
                                                onClick={() => confirmSubmit(weed.id)}
                                            />
                                        )}

                                        {!rowEdit[weed.id] ? (
                                            <TableButton
                                                variant='delete'
                                                onClick={() => {
                                                    setDeleteId(weed.id)
                                                    setDeleteName(weed.name)
                                                    setShowDeleteWeedModal(!showDeleteWeedModal)
                                                }}
                                            />
                                        ) : (
                                            <GeralButton
                                                variant='noStyle'
                                                type='button'
                                                onClick={() => {
                                                    setRowEdit((prevStates) => ({
                                                        ...prevStates,
                                                        [weed.id]: !prevStates[weed.id],
                                                    }))

                                                    setRowData((prevState) => ({
                                                        ...prevState,
                                                        [weed.id]: {
                                                            name: weed.name,
                                                            scientific_name: weed.scientific_name,
                                                            observation: weed.observation,
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

                <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

                {!data.interference_factors_items ||
                    (data.interference_factors_items.length == 0 && (
                        <TableRow emptyString='Nenhuma daninha encontrada' columnsCount={1} />
                    ))}

                <GeralModal
                    small
                    isDelete
                    deleteName={deleteName}
                    deleteFunction={deleteUser}
                    show={showDeleteWeedModal}
                    setShow={setShowDeleteWeedModal}
                    title='Excluir daninha'
                />
            </Suspense>
        </GeralTable>
    )
}
