'use client'

import Admin from '@/@types/Admin'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
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
import axios from 'axios'
import { ChangeEvent, MouseEvent, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import dropdownStyles from '../styles.module.scss'

interface RowDataType {
    name: string
    code: string[]
    admin?: Admin
    status?: string
}

interface CulturesProps {
    toggleNewRow: boolean
    setToggleNewRow: (toggleNewRow: boolean) => void
}

const tableHeaders = ['#', 'Cultura', 'Cor', 'Situação', 'Cultivares', 'Ações']
const selectOptions = [
    {
        value: '1',
        label: 'Ativo',
    },
    {
        value: '2',
        label: 'Inativo',
    },
]

const updateStatusRoute = '/api/inputs/cultures/alter-status'

export default function Cultures({ toggleNewRow: newRow, setToggleNewRow: setNewRow }: CulturesProps) {
    const { setToast } = useNotification()
    const { searchPage } = useSearch()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)
    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(
        `/api/inputs/cultures/list/${admin.id}?filter=${searchPage}&page=${activePage}`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteCultureModal, setShowDeleteCultureModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowOpen, setRowOpen] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo cultura ${deleteName}`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteCultureModal(false)

                setToast({ text: `Cultura ${deleteName} excluída`, state: 'success' })
                mutate(`/api/inputs/cultures/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
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

    const handleSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const { id, value } = e.target

        setToast({ text: `Alterando situação`, state: 'loading' })

        await updateStatus(updateStatusRoute, admin.id, id, value).then(() => {
            setToast({ text: `Situação alterada`, state: 'success' })
            mutate(`/api/inputs/cultures/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
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
                text: `${id == 0 ? 'Criando' : 'Atualizando'} cultura ${rowData[id].name}`,
                state: 'loading',
            })

            rowData[id].code = rowData[id].code.filter((code: string) => code != '')

            axios.post('/api/inputs/cultures/form', { ...rowData[id], id, admin_id: admin.id }).then((response) => {
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
                            0: { name: '', code: [''] },
                        }))

                        setNewRow(false)
                    }

                    mutate(`/api/inputs/cultures/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
                }
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const changeRowOpen = (id: number) => {
        setRowOpen((prevStates) => ({
            ...prevStates,
            [id]: !prevStates[id],
        }))
    }

    const handleCodeChange = (e: ChangeEvent<HTMLInputElement>, id: any, codeIndex: number) => {
        const { value } = e.target

        const code = rowData[id]?.code
        code[codeIndex] = value

        setRowData((prevStates) => ({
            ...prevStates,
            [id]: { ...prevStates[id], code },
        }))
    }

    const removeCode = (id: number, index: number) => {
        const newCode = rowData[id]?.code
        newCode.splice(index, 1)

        setRowData((prevStates) => ({
            ...prevStates,
            [id]: { ...prevStates[id], code: newCode },
        }))
    }

    const addCode = (id: any) => {
        return () => {
            const newCode = rowData[id]?.code
            newCode.push('')

            setRowData((prevStates) => ({
                ...prevStates,
                [id]: { ...prevStates[id], code: newCode },
            }))
        }
    }

    useEffect(() => {
        if (data && data.cultures) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 100))
            const initialEditState: { [key: number]: boolean } = {}
            data.cultures.forEach((culture: any) => {
                initialEditState[culture.id] = rowOpen[culture.id] ?? false
            })
            setRowOpen(initialEditState)
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            initialFormState[0] = {
                name: '',
                code: [''],
                status: '1',
            }

            data.cultures.forEach((culture: any) => {
                initialFormState[culture.id] = {
                    name: culture.name,
                    code: culture.extra_column ? culture.extra_column.split(',') : [''],
                    // code: culture.extra_column,
                    status: culture.status,
                    admin: culture.admin,
                }
            })
            setRowData(initialFormState)
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de culturas`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <GeralTable headers={tableHeaders} gridColumns={`0.01fr 1fr 0.7fr 0.7fr  2fr 1fr`}>
            <Suspense fallback={<TableSkeleton />}>
                {newRow && (
                    <div className={`${dropdownStyles.withDropdown} ${dropdownStyles.opened}`}>
                        <div className={dropdownStyles.dropdownInfo} style={{ cursor: 'pointer' }}>
                            <TableRow gridColumns={`0.01fr 1fr 0.7fr 0.7fr  2fr 1fr`}>
                                <div>
                                    <IconifyIcon icon='lucide:chevron-down' />
                                </div>
                                <div data-type='content'>
                                    <GeralInput
                                        variant='inline'
                                        name='name'
                                        defaultValue={rowData[0]?.name}
                                        readOnly={false}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            handleUserInputChange(event, 0)
                                        }
                                    />
                                </div>

                                {/* <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='code'
                            defaultValue={rowData[0]?.code}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                            maxLength={50000}
                        />
                    </div> */}

                                <div>--</div>

                                <div data-type='content'>
                                    <TableSelect
                                        defaultValue={rowData[0]?.status ?? 1}
                                        itemId={0}
                                        name='status'
                                        options={selectOptions}
                                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                                            handleUserInputChange(event, 0)
                                        }
                                    />
                                </div>

                                <div>--</div>

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
                        </div>
                        <div className={`${dropdownStyles.dropdownMenu} ${dropdownStyles.panelDropdown}`}>
                            <GeralTable
                                customClasses={[tableStyles.dropdownPanel]}
                                headers={[]}
                                gridColumns={`0.01fr 1fr 0.7fr 0.7fr  2fr 1fr`}>
                                {rowData[0]?.code.map((code: string, index: number) => (
                                    <TableRow
                                        gridColumns={`0.01fr 1fr 0.7fr 0.7fr   2fr 1fr`}
                                        key={`code-row-0-${index + 1}`}>
                                        <div />
                                        <div />
                                        <div />
                                        <div />
                                        <div />
                                        <div>
                                            <GeralInput
                                                variant='inline'
                                                name='name'
                                                defaultValue={code}
                                                readOnly={false}
                                                placeholder='Digite o cultivar'
                                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                    handleCodeChange(event, 0, index)
                                                }
                                            />
                                        </div>
                                        <div data-type='action'>
                                            {rowData[0]?.code.length > 1 && (
                                                <TableActions>
                                                    <TableButton
                                                        variant='delete'
                                                        onClick={(
                                                            event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
                                                        ) => {
                                                            event.stopPropagation()
                                                            removeCode(0, index)
                                                        }}
                                                    />
                                                </TableActions>
                                            )}
                                        </div>
                                    </TableRow>
                                ))}

                                <TableRow gridColumns={`0.01fr 1fr 0.7fr 0.7fr  2fr 1fr`}>
                                    <div />
                                    <div />
                                    <div />
                                    <div />
                                    <div>
                                        <GeralButton type='button' variant='inlineGreen' onClick={addCode(0)}>
                                            + Adicionar cultivar
                                        </GeralButton>
                                    </div>
                                    <div data-type='action'></div>
                                </TableRow>
                            </GeralTable>
                        </div>
                    </div>
                )}

                {data?.cultures?.map((culture: any) => (
                    <div
                        key={culture.id}
                        className={`${dropdownStyles.withDropdown} ${rowOpen[culture.id] ? dropdownStyles.opened : ''}`}>
                        <div
                            className={dropdownStyles.dropdownInfo}
                            style={{ cursor: 'pointer' }}
                            onClick={() => changeRowOpen(culture.id)}>
                            <TableRow gridColumns={`0.01fr 1fr 0.7fr 0.7fr   2fr 1fr`}>
                                <div>
                                    <IconifyIcon icon='lucide:chevron-down' />
                                </div>
                                <div data-type='content'>
                                    <GeralInput
                                        variant='inline'
                                        name='name'
                                        defaultValue={rowData[culture.id]?.name}
                                        readOnly={!rowEdit[culture.id]}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            handleUserInputChange(event, culture.id)
                                        }
                                    />
                                </div>

                                {/* <div data-type='content'>
                                    <GeralInput
                                        variant='inline'
                                        name='code'
                                        defaultValue={rowData[culture.id]?.code}
                                        readOnly={!rowEdit[culture.id]}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            handleUserInputChange(event, culture.id)
                                        }
                                        maxLength={50000}
                                    />
                                </div> */}

                                <div>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: '20px',
                                            height: '20px',
                                            backgroundColor: culture.color,
                                            borderRadius: '50%',
                                        }}
                                    />
                                </div>

                                <div data-type='content'>
                                    {admin.access_level == 1 ? (
                                        <TableSelect
                                            defaultValue={rowData[culture.id]?.status}
                                            itemId={culture.id}
                                            name='status'
                                            options={selectOptions}
                                            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                                                !rowEdit[culture.id]
                                                    ? handleSelectChange(event)
                                                    : handleUserInputChange(event, culture.id)
                                            }
                                        />
                                    ) : (
                                        <p>{rowData[culture.id]?.status?.toString() == '1' ? 'Ativo' : 'Inativo'}</p>
                                    )}
                                </div>

                                {/* <div>
                                    {rowData[culture.id]?.admin?.name
                                        ? rowData[culture.id]?.admin?.name
                                        : 'Fito Agrícola'}
                                </div> */}
                                <div />

                                <div data-type='action'>
                                    {admin.access_level == 1 && (
                                        <TableActions>
                                            {!rowEdit[culture.id] ? (
                                                <TableButton
                                                    variant='edit'
                                                    onClick={(
                                                        event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
                                                    ) => {
                                                        event.stopPropagation()
                                                        setRowOpen((prevStates) => ({
                                                            ...prevStates,
                                                            [culture.id]: true,
                                                        }))
                                                        setRowEdit((prevStates) => ({
                                                            ...prevStates,
                                                            [culture.id]: !prevStates[culture.id],
                                                        }))
                                                    }}
                                                />
                                            ) : (
                                                <GeralButton
                                                    variant='secondary'
                                                    value='Salvar'
                                                    type='button'
                                                    smaller
                                                    onClick={() => confirmSubmit(culture.id)}
                                                />
                                            )}

                                            {!rowEdit[culture.id] ? (
                                                <TableButton
                                                    variant='delete'
                                                    onClick={(
                                                        event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
                                                    ) => {
                                                        event.stopPropagation()
                                                        setDeleteId(culture.id)
                                                        setDeleteName(culture.name)
                                                        setShowDeleteCultureModal(!showDeleteCultureModal)
                                                    }}
                                                />
                                            ) : (
                                                <GeralButton
                                                    variant='noStyle'
                                                    type='button'
                                                    onClick={(
                                                        event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
                                                    ) => {
                                                        event.stopPropagation()
                                                        setRowOpen((prevStates) => ({
                                                            ...prevStates,
                                                            [culture.id]: false,
                                                        }))
                                                        setRowEdit((prevStates) => ({
                                                            ...prevStates,
                                                            [culture.id]: !prevStates[culture.id],
                                                        }))
                                                    }}>
                                                    <IconifyIcon icon='ph:x' />
                                                </GeralButton>
                                            )}
                                        </TableActions>
                                    )}
                                </div>
                            </TableRow>
                        </div>

                        {rowOpen[culture.id] && (
                            <div className={`${dropdownStyles.dropdownMenu} ${dropdownStyles.panelDropdown}`}>
                                <GeralTable
                                    customClasses={[tableStyles.dropdownPanel]}
                                    headers={[]}
                                    gridColumns={`0.01fr 1fr 0.7fr 0.7fr  2fr 1fr`}>
                                    {rowData[culture.id]?.code.map((code: string, index: number) => (
                                        <TableRow
                                            gridColumns={`0.01fr 1fr 0.7fr 0.7fr 2fr 1fr`}
                                            key={`code-row-${culture.id}-${index}`}>
                                            <div />
                                            <div />
                                            {/* <div /> */}
                                            <div />
                                            <div />
                                            <div>
                                                <GeralInput
                                                    variant='inline'
                                                    name='name'
                                                    defaultValue={code}
                                                    readOnly={!rowEdit[culture.id]}
                                                    placeholder='Digite o cultivar'
                                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                        handleCodeChange(event, culture.id, index)
                                                    }
                                                />
                                            </div>
                                            <div data-type='action'>
                                                {rowEdit[culture.id] && rowData[culture.id]?.code.length > 1 && (
                                                    <TableActions>
                                                        <TableButton
                                                            variant='delete'
                                                            onClick={(
                                                                event: MouseEvent<
                                                                    HTMLAnchorElement | HTMLButtonElement
                                                                >,
                                                            ) => {
                                                                event.stopPropagation()
                                                                removeCode(culture.id, index)
                                                            }}
                                                        />
                                                    </TableActions>
                                                )}
                                            </div>
                                        </TableRow>
                                    ))}

                                    {rowEdit[culture.id] && (
                                        <TableRow gridColumns={`0.01fr 1fr 0.7fr 0.7fr  2fr 1fr`}>
                                            <div />
                                            <div />
                                            <div />
                                            {/* <div /> */}
                                            <div />
                                            <div>
                                                <GeralButton
                                                    type='button'
                                                    variant='inlineGreen'
                                                    onClick={addCode(culture.id)}>
                                                    + Adicionar cultivar
                                                </GeralButton>
                                            </div>
                                            <div data-type='action'></div>
                                        </TableRow>
                                    )}
                                </GeralTable>
                            </div>
                        )}
                    </div>
                ))}

                <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

                {!data.cultures ||
                    (data.cultures.length == 0 && (
                        <TableRow emptyString='Nenhuma cultura encontrada' columnsCount={1} />
                    ))}

                <GeralModal
                    small
                    isDelete
                    deleteName={deleteName}
                    deleteFunction={deleteUser}
                    show={showDeleteCultureModal}
                    setShow={setShowDeleteCultureModal}
                    title='Excluir cultura'
                />
            </Suspense>
        </GeralTable>
    )
}
