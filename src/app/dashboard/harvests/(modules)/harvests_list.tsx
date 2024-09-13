'use client'

import GeralButton from '@/components/buttons/GeralButton'
import PageHeader from '@/components/header/PageHeader'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TableHeader from '@/components/tables/TableHeader'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { useRouter } from 'nextjs-toploader/app'
import { ChangeEvent, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { clearTimeout } from 'timers'

interface RowDataType {
    name: string
    start_date: string
    end_date: string
    is_last_harvest: number
}

interface HarvestsRowsProps {
    newRow: boolean
    setNewRow: (newRow: boolean) => void
}

const tableHeaders = ['Nome do ano agrícola', 'Data início', 'Data final', 'Ano agrícola atual', 'Ações']
const updateStatusRoute = '/api/harvests/delete'

function HarvestsRows({ newRow, setNewRow }: HarvestsRowsProps) {
    const { setToast } = useNotification()
    const { searchPage } = useSearch()
    const { admin } = useAdmin()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    const router = useRouter()

    const { data, isLoading, error } = useSWR(`/api/harvests/list?filter=${searchPage}&page=${activePage}`, getFetch)

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteHarvestModal, setShowDeleteHarvestModal] = useState(false)
    const [showRegisterHarvestModal, setShowRegisterHarvestModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')

    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo ano agrícola ${deleteName}`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteHarvestModal(false)

                setToast({ text: `Ano agrícola ${deleteName} excluída`, state: 'success' })
                mutate(`/api/harvests/list?filter=${searchPage}&page=${activePage}`)
                mutate(`/api/dashboard/get-itens/${admin.id}?filter=simple`)
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
                text: `${id == 0 ? 'Criando' : 'Atualizando'} ano agrícola ${rowData[id].name}`,
                state: 'loading',
            })

            axios
                .post('/api/harvests/form', { ...rowData[id], id, admin_id: admin.id })
                .then((response) => {
                    if (response.status == 200) {
                        setToast({
                            text: `Ano agrícola ${rowData[id].name} ${id == 0 ? 'criada' : 'atualizada'}`,
                            state: 'success',
                        })

                        setShowRegisterHarvestModal(false)

                        setRowEdit((prevStates) => ({
                            ...prevStates,
                            [id]: !prevStates[id],
                        }))

                        if (id == 0) {
                            setRowData((prevStates) => ({
                                ...prevStates,
                                0: { name: '', start_date: '', end_date: '', is_last_harvest: 0 },
                            }))

                            setNewRow(false)
                        }

                        mutate(`/api/harvests/list?filter=${searchPage}&page=${activePage}`)
                        mutate(`/api/dashboard/get-itens/${admin.id}?filter=simple`)
                    }
                })
                .catch((error) => {
                    throw error
                })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 10))
            const initialEditState: { [key: number]: boolean } = {}
            data.harvests.forEach((harvest: any) => {
                initialEditState[harvest.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            initialFormState[0] = {
                name: '',
                start_date: '',
                end_date: '',
                is_last_harvest: 0,
            }

            data.harvests.forEach((harvest: any) => {
                initialFormState[harvest.id] = {
                    name: harvest.name,
                    start_date: harvest.start_date,
                    end_date: harvest.end_date,
                    is_last_harvest: harvest.is_last_harvest,
                }
            })
            setRowData(initialFormState)
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de anos agrícolas`, state: 'danger' })
            }
        }
    }, [error])

    useEffect(() => {
        if (admin && admin.is_super_user == 0) {
            setToast({ text: `Você não tem permissão para acessar essa tela`, state: 'info' })

            router.push('/dashboard')
        }
    }, [admin])

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
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
                            name='start_date'
                            type='date'
                            defaultValue={rowData[0]?.start_date}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='end_date'
                            type='date'
                            defaultValue={rowData[0]?.end_date}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>
                        <GeralInput
                            type='checkbox'
                            label='Último ano agrícola'
                            variant='checkbox'
                            checked={rowData[0]?.is_last_harvest == 1}
                            onChange={() => {
                                setRowData((prevStates) => ({
                                    ...prevStates,
                                    0: {
                                        ...prevStates[0],
                                        is_last_harvest: prevStates[0].is_last_harvest == 1 ? 0 : 1,
                                    },
                                }))
                            }}
                        />
                    </div>

                    <div data-type='action'>
                        <TableActions>
                            <GeralButton
                                variant='secondary'
                                value='Salvar'
                                type='button'
                                smaller
                                onClick={() => {
                                    if (rowData[0]?.is_last_harvest == 1) {
                                        setShowRegisterHarvestModal(!showRegisterHarvestModal)
                                    } else {
                                        confirmSubmit(0)
                                    }
                                }}
                            />
                            <GeralButton variant='noStyle' type='button' onClick={() => setNewRow(false)}>
                                <IconifyIcon icon='ph:x' />
                            </GeralButton>
                        </TableActions>
                    </div>
                </TableRow>
            )}

            {data.harvests &&
                data.harvests.map((harvest: any) => (
                    <TableRow key={harvest.id} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='name'
                                defaultValue={rowData[harvest.id]?.name}
                                readOnly={!rowEdit[harvest.id]}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, harvest.id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='start_date'
                                type='date'
                                defaultValue={rowData[harvest.id]?.start_date}
                                readOnly={!rowEdit[harvest.id]}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, harvest.id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='end_date'
                                type='date'
                                defaultValue={rowData[harvest.id]?.end_date}
                                readOnly={!rowEdit[harvest.id]}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, harvest.id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            {rowEdit[harvest.id] ? (
                                <GeralInput
                                    type='checkbox'
                                    label='Último ano agrícola'
                                    variant='checkbox'
                                    checked={rowData[harvest.id]?.is_last_harvest == 1}
                                    onChange={() => {
                                        setRowData((prevStates) => ({
                                            ...prevStates,
                                            [harvest.id]: {
                                                ...prevStates[harvest.id],
                                                is_last_harvest: prevStates[harvest.id].is_last_harvest == 1 ? 0 : 1,
                                            },
                                        }))
                                    }}
                                />
                            ) : rowData[harvest.id]?.is_last_harvest == 1 ? (
                                'Sim'
                            ) : (
                                'Não'
                            )}
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                {!rowEdit[harvest.id] ? (
                                    <TableButton
                                        variant='edit'
                                        onClick={() => {
                                            setRowEdit((prevStates) => ({
                                                ...prevStates,
                                                [harvest.id]: !prevStates[harvest.id],
                                            }))
                                        }}
                                    />
                                ) : (
                                    <GeralButton
                                        variant='secondary'
                                        value='Salvar'
                                        type='button'
                                        smaller
                                        onClick={() => confirmSubmit(harvest.id)}
                                    />
                                )}

                                {!rowEdit[harvest.id] ? (
                                    <TableButton
                                        variant='delete'
                                        onClick={() => {
                                            setDeleteId(harvest.id)
                                            setDeleteName(harvest.name)
                                            setShowDeleteHarvestModal(!showDeleteHarvestModal)
                                        }}
                                    />
                                ) : (
                                    <GeralButton
                                        variant='noStyle'
                                        type='button'
                                        onClick={() => {
                                            setRowEdit((prevStates) => ({
                                                ...prevStates,
                                                [harvest.id]: !prevStates[harvest.id],
                                            }))
                                        }}>
                                        <IconifyIcon icon='ph:x' />
                                    </GeralButton>
                                )}
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

            {!data.harvests ||
                (data.harvests.length == 0 && (
                    <TableRow emptyString='Nenhum ano agrícola encontrada' columnsCount={1} />
                ))}

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteUser}
                show={showDeleteHarvestModal}
                setShow={setShowDeleteHarvestModal}
                title='Excluir ano agrícola'
            />

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={() => confirmSubmit(0)}
                show={showRegisterHarvestModal}
                setShow={setShowRegisterHarvestModal}
                title='Adicionar ano agrícola'
                deleteButtonText='Sim, adicionar'
                deleteText='Voce está certo disso? Ao adicionar um ano agrícola novo como "Ano agrícola atual", o ano agrícola corrente será acessada como histórico, podendo ser alterada normalmente, porém não será exibida como último ano agrícola.'
            />
        </>
    )
}

export const HarvestsList = () => {
    const [toggleNewRow, setToggleNewRow] = useState(false)

    return (
        <>
            <PageHeader placeholder={`Pesquisar em "ano agrícola"`} />

            <TableHeader
                title='Anos agrícolas'
                description='Confira abaixo a sua lista completa de anos agrícolas. Adicione novos clicando no botão acima à direita.'
                titleIcon='ph:circle-half'
                buttonActionName='Adicionar ano agrícola'
                onButtonAction={() => setToggleNewRow(!toggleNewRow)}
            />
            <GeralTable headers={tableHeaders} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                <Suspense fallback={<TableSkeleton />}>
                    <HarvestsRows newRow={toggleNewRow} setNewRow={setToggleNewRow} />
                </Suspense>
            </GeralTable>
        </>
    )
}
