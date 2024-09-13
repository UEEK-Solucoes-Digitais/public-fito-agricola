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
    observation: string
    systemLog?: any
}

interface FertilizersProps {
    toggleNewRow: boolean
    setToggleNewRow: (toggleNewRow: boolean) => void
}

const tableHeaders = ['Nome', 'Observações', 'Ações']

const updateStatusRoute = '/api/inputs/fertilizers/delete'

export default function Fertilizers({ toggleNewRow: newRow, setToggleNewRow: setNewRow }: FertilizersProps) {
    const { setToast } = useNotification()
    const { searchPage } = useSearch()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)
    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(
        `/api/inputs/fertilizers/list/${admin.id}?filter=${searchPage}&page=${activePage}`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteFertilizerModal, setShowDeleteFertilizerModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo fertilizante ${deleteName}`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteFertilizerModal(false)

                setToast({ text: `Fertilizante ${deleteName} excluída`, state: 'success' })
                mutate(`/api/inputs/fertilizers/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
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
                text: `${id == 0 ? 'Criando' : 'Atualizando'} fertilizante ${rowData[id].name}`,
                state: 'loading',
            })

            axios.post('/api/inputs/fertilizers/form', { ...rowData[id], id, admin_id: admin.id }).then((response) => {
                if (response.status == 200) {
                    setToast({
                        text: `Fertilizante ${rowData[id].name} ${id == 0 ? 'criada' : 'atualizada'}`,
                        state: 'success',
                    })

                    setRowEdit((prevStates) => ({
                        ...prevStates,
                        [id]: !prevStates[id],
                    }))

                    if (id == 0) {
                        setRowData((prevStates) => ({
                            ...prevStates,
                            0: { name: '', observation: '' },
                        }))

                        setNewRow(false)
                    }

                    mutate(`/api/inputs/fertilizers/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
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
            data.fertilizers.forEach((fertilizer: any) => {
                initialEditState[fertilizer.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            initialFormState[0] = {
                name: '',
                observation: '',
            }

            data.fertilizers.forEach((fertilizer: any) => {
                initialFormState[fertilizer.id] = {
                    name: fertilizer.name,
                    observation: fertilizer.extra_column,
                    // systemLog: fertilizer.system_log,
                }
            })
            setRowData(initialFormState)
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de fertilizantes`, state: 'danger' })
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
                                name='observation'
                                defaultValue={rowData[0]?.observation}
                                readOnly={false}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                            />
                        </div>

                        {/* <div>--</div> */}

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

                {data.fertilizers &&
                    data.fertilizers.map((fertilizer: any) => (
                        <TableRow key={fertilizer.id} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='name'
                                    defaultValue={rowData[fertilizer.id]?.name}
                                    readOnly={!rowEdit[fertilizer.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, fertilizer.id)
                                    }
                                />
                            </div>

                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='observation'
                                    defaultValue={rowData[fertilizer.id]?.observation}
                                    readOnly={!rowEdit[fertilizer.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, fertilizer.id)
                                    }
                                />
                            </div>

                            {/* <div>
                            {rowData[fertilizer.id]?.systemLog?.admin?.name
                                ? rowData[fertilizer.id]?.systemLog?.admin?.name
                                : 'Fito Agrícola'}
                        </div> */}

                            <div data-type='action'>
                                {admin.access_level == 1 && (
                                    <TableActions>
                                        {!rowEdit[fertilizer.id] ? (
                                            <TableButton
                                                variant='edit'
                                                onClick={() => {
                                                    setRowEdit((prevStates) => ({
                                                        ...prevStates,
                                                        [fertilizer.id]: !prevStates[fertilizer.id],
                                                    }))
                                                }}
                                            />
                                        ) : (
                                            <GeralButton
                                                variant='secondary'
                                                value='Salvar'
                                                type='button'
                                                smaller
                                                onClick={() => confirmSubmit(fertilizer.id)}
                                            />
                                        )}

                                        {!rowEdit[fertilizer.id] ? (
                                            <TableButton
                                                variant='delete'
                                                onClick={() => {
                                                    setDeleteId(fertilizer.id)
                                                    setDeleteName(fertilizer.name)
                                                    setShowDeleteFertilizerModal(!showDeleteFertilizerModal)
                                                }}
                                            />
                                        ) : (
                                            <GeralButton
                                                variant='noStyle'
                                                type='button'
                                                onClick={() => {
                                                    setRowEdit((prevStates) => ({
                                                        ...prevStates,
                                                        [fertilizer.id]: !prevStates[fertilizer.id],
                                                    }))

                                                    setRowData((prevState) => ({
                                                        ...prevState,
                                                        [fertilizer.id]: {
                                                            name: fertilizer.name,
                                                            observation: fertilizer.observation,
                                                            status: fertilizer.status,
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

                {!data.fertilizers ||
                    (data.fertilizers.length == 0 && (
                        <TableRow emptyString='Nenhum fertilizante encontrado' columnsCount={1} />
                    ))}

                <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

                <GeralModal
                    small
                    isDelete
                    deleteName={deleteName}
                    deleteFunction={deleteUser}
                    show={showDeleteFertilizerModal}
                    setShow={setShowDeleteFertilizerModal}
                    title='Excluir fertilizante'
                />
            </Suspense>
        </GeralTable>
    )
}
