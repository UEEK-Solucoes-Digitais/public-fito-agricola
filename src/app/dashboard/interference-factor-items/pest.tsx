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
import styles from './styles.module.scss'

interface RowDataType {
    name: string
    scientific_name: string
    observation?: string
    type?: string
}

interface PestsProps {
    toggleNewRow: boolean
    setToggleNewRow: (toggleNewRow: boolean) => void
}

const tableHeaders = ['Nome', 'Nome Científico', 'Observações', 'Culturas', 'Ações']
const updateStatusRoute = '/api/interference-factors/delete'

export default function Pests({ toggleNewRow: newRow, setToggleNewRow: setNewRow }: PestsProps) {
    const { admin } = useAdmin()
    const { setToast } = useNotification()
    const { searchPage } = useSearch()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)
    const [selectOptions, setSelectOptions] = useState<object[]>([])
    const [toggleOptions, setToggleOptions] = useState(false)
    const [culturesSelectId, setCulturesSelectId] = useState(0)
    const [showCulturesList, setShowCulturesList] = useState(false)
    const [selectedCultures, setSelectedCultures] = useState<{
        [key: number]: Array<{ value: string; label: string }>
    }>({})

    const { data, isLoading, error } = useSWR(
        `/api/interference-factors/list/3?filter=${searchPage}&page=${activePage}`,
        getFetch,
    )

    const { data: cultureData } = useSWR(`/api/inputs/cultures/list/${admin.id}`, getFetch)

    const [deleteId, setDeleteId] = useState(0)
    const [showDeletePestModal, setShowDeletePestModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})

    const deleteUser = async () => {
        try {
            setToast({ text: `Excluindo praga ${deleteName}`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeletePestModal(false)

                setToast({ text: `Cultura ${deleteName} excluída`, state: 'success' })
                mutate(`/api/interference-factors/list/3?filter=${searchPage}&page=${activePage}`)
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

    const prepareDataForSubmission = (id: number) => {
        const culturesValues = selectedCultures[id]?.map((culture) => culture.value) || []

        const updatedRowData = {
            ...rowData[id],
            cultures: culturesValues,
            type: rowData[id].type || 3,
        }

        return updatedRowData
    }

    const confirmSubmit = (id: number) => {
        try {
            setToast({
                text: `${id == 0 ? 'Criando' : 'Atualizando'} praga ${rowData[id].name}`,
                state: 'loading',
            })

            const dataToSubmit = prepareDataForSubmission(id)

            axios
                .post('/api/interference-factors/form', { ...dataToSubmit, id, admin_id: admin.id })
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

                        mutate(`/api/interference-factors/list/3?filter=${searchPage}&page=${activePage}`)
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

    const handleCultureListClick = (id: number, value: string, label: string) => {
        setSelectedCultures((prevCultures) => {
            const updatedCultures = { ...prevCultures }
            const culturesForId = updatedCultures[id] || []
            const index = culturesForId.findIndex((culture) => culture.value == value)

            if (index >= 0) {
                updatedCultures[id] = [...culturesForId.slice(0, index), ...culturesForId.slice(index + 1)]
            } else {
                updatedCultures[id] = [...culturesForId, { value, label }]
            }

            if (updatedCultures[id].length == 0) {
                delete updatedCultures[id]
            }

            return updatedCultures
        })
    }

    const handleRemoveCulture = (id: number, value: string) => {
        setSelectedCultures((prevCultures) => {
            const updatedCulturesForId = prevCultures[id] ? [...prevCultures[id]] : []

            const filteredCultures = updatedCulturesForId.filter((culture) => culture.value != value)

            if (filteredCultures.length == 0) {
                const { [id]: _, ...rest } = prevCultures
                return rest
            }

            return { ...prevCultures, [id]: filteredCultures }
        })
    }

    useEffect(() => {
        if (newRow) {
            setCulturesSelectId(0)
        }
    }, [newRow])

    useEffect(() => {
        if (cultureData) {
            const options: any = []

            cultureData.cultures.forEach((culture: any) => {
                options.push({
                    value: culture.id,
                    label: culture.name,
                })
            })

            setSelectOptions(options)
        }
    }, [cultureData])

    useEffect(() => {
        if (data) {
            const { total, interference_factors_items } = data
            setPageNumbers(Math.ceil(total / 10))
            const initialEditState: any = {}
            const initialFormState: any = {}
            const newSelectedCultures: any = {}

            interference_factors_items.forEach((pest: any) => {
                initialEditState[pest.id] = false
                initialFormState[pest.id] = {
                    name: pest.name,
                    scientific_name: pest.scientific_name,
                    observation: pest.observation,
                    type: pest.type,
                }

                newSelectedCultures[pest.id] = pest.cultures_pests.map((culture: any) => ({
                    value: culture.id,
                    label: culture.name,
                }))
            })

            setRowEdit(initialEditState)
            setRowData(initialFormState)
            setSelectedCultures(newSelectedCultures)
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de pragas`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <GeralTable headers={tableHeaders} gridColumns={`repeat(3, 1fr) 2.5fr 0.5fr`}>
            <Suspense fallback={<TableSkeleton />}>
                {newRow && (
                    <TableRow gridColumns={`repeat(3, 1fr) 2.5fr 0.5fr`}>
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

                        <div data-type='content' className={`${styles.cultureSelectWrapper}`}>
                            {selectedCultures[0] &&
                                selectedCultures[0].map(
                                    (culture: any, index: number) =>
                                        index < 7 && (
                                            <button
                                                key={`${culture.value}-${index}`}
                                                type='button'
                                                className={styles.selectedItem}>
                                                {`${culture.label}${
                                                    index < 7 && index != selectedCultures[0].length - 1 ? ', ' : ''
                                                }`}
                                            </button>
                                        ),
                                )}

                            {selectedCultures[0] && selectedCultures[0].length > 7 && (
                                <span>+{selectedCultures[0].length - 7}</span>
                            )}

                            <GeralButton
                                small
                                smaller
                                smallIcon
                                variant={selectedCultures[0] && selectedCultures[0].length > 0 ? 'noStyle' : 'tertiary'}
                                title='Clique aqui para conferir a lista de culturas'
                                customClasses={[`${styles.toggleCulturesButton}`]}
                                onClick={() => {
                                    setShowCulturesList(true)
                                    setCulturesSelectId(0)
                                }}>
                                {selectedCultures[0] && selectedCultures[0].length > 0 ? (
                                    <IconifyIcon icon='ph:pencil-simple' />
                                ) : (
                                    'Editar culturas'
                                )}
                            </GeralButton>
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
                    data.interference_factors_items.map((pest: any) => (
                        <TableRow key={pest.id} gridColumns={`repeat(3, 1fr) 2.5fr 0.5fr`}>
                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='name'
                                    defaultValue={rowData[pest.id]?.name}
                                    readOnly={!rowEdit[pest.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, pest.id)
                                    }
                                />
                            </div>

                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='scientific_name'
                                    defaultValue={rowData[pest.id]?.scientific_name}
                                    readOnly={!rowEdit[pest.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, pest.id)
                                    }
                                />
                            </div>

                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='observation'
                                    defaultValue={rowData[pest.id]?.observation}
                                    readOnly={!rowEdit[pest.id]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, pest.id)
                                    }
                                />
                            </div>

                            <div data-type='content' className={`${styles.cultureSelectWrapper}`}>
                                {selectedCultures[pest.id] &&
                                    selectedCultures[pest.id].map(
                                        (culture: any, index: number) =>
                                            index < 7 && (
                                                <button
                                                    key={`${culture.id}-${index}`}
                                                    type='button'
                                                    className={styles.selectedItem}>
                                                    {`${culture.label}${
                                                        index < 7 && index != selectedCultures[pest.id].length - 1
                                                            ? ', '
                                                            : ''
                                                    }`}
                                                </button>
                                            ),
                                    )}

                                {selectedCultures[pest.id] && selectedCultures[pest.id].length > 7 && (
                                    <span>+{selectedCultures[pest.id].length - 7}</span>
                                )}

                                {rowEdit[pest.id] && (
                                    <GeralButton
                                        small
                                        smaller
                                        smallIcon
                                        variant={
                                            selectedCultures[pest.id] && selectedCultures[pest.id].length > 0
                                                ? 'noStyle'
                                                : 'tertiary'
                                        }
                                        title='Clique aqui para conferir a lista de culturas'
                                        customClasses={[`${styles.toggleCulturesButton}`]}
                                        onClick={() => {
                                            setShowCulturesList(true)
                                            setCulturesSelectId(pest.id)
                                        }}>
                                        {selectedCultures[pest.id] && selectedCultures[pest.id].length > 0 ? (
                                            <IconifyIcon icon='ph:pencil-simple' />
                                        ) : (
                                            'Editar culturas'
                                        )}
                                    </GeralButton>
                                )}
                            </div>

                            <div data-type='action'>
                                {admin.access_level == 1 && (
                                    <TableActions>
                                        {!rowEdit[pest.id] ? (
                                            <TableButton
                                                variant='edit'
                                                onClick={() => {
                                                    setRowEdit((prevStates) => ({
                                                        ...prevStates,
                                                        [pest.id]: !prevStates[pest.id],
                                                    }))
                                                }}
                                            />
                                        ) : (
                                            <GeralButton
                                                variant='secondary'
                                                value='Salvar'
                                                type='button'
                                                smaller
                                                onClick={() => confirmSubmit(pest.id)}
                                            />
                                        )}

                                        {!rowEdit[pest.id] ? (
                                            <TableButton
                                                variant='delete'
                                                onClick={() => {
                                                    setDeleteId(pest.id)
                                                    setDeleteName(pest.name)
                                                    setShowDeletePestModal(!showDeletePestModal)
                                                }}
                                            />
                                        ) : (
                                            <GeralButton
                                                variant='noStyle'
                                                type='button'
                                                onClick={() => {
                                                    setRowEdit((prevStates) => ({
                                                        ...prevStates,
                                                        [pest.id]: !prevStates[pest.id],
                                                    }))

                                                    setRowData((prevState) => ({
                                                        ...prevState,
                                                        [pest.id]: {
                                                            name: pest.name,
                                                            scientific_name: pest.scientific_name,
                                                            observation: pest.observation,
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
                        <TableRow emptyString='Nenhuma praga encontrada' columnsCount={1} />
                    ))}

                <GeralModal
                    small
                    isDelete
                    deleteName={deleteName}
                    deleteFunction={deleteUser}
                    show={showDeletePestModal}
                    setShow={setShowDeletePestModal}
                    title='Excluir praga'
                />

                <GeralModal
                    show={showCulturesList}
                    setShow={setShowCulturesList}
                    title='Selecione as culturas para vincular'>
                    <div className={`${styles.culturesSelect}`}>
                        <div
                            className={`${styles.selected} ${toggleOptions ? styles.show : ''}`}
                            onClick={() => {
                                setToggleOptions(!toggleOptions)
                            }}>
                            Clique aqui para selecionar as culturas
                        </div>
                        <div className={`${styles.options} ${toggleOptions ? styles.show : ''}`}>
                            {selectOptions &&
                                selectOptions.map((option: any) => {
                                    const isSelected = selectedCultures[culturesSelectId]?.some(
                                        (culture) => culture.value == option.value,
                                    )

                                    const buttonClasses = `exceptionOutside ${styles.option} ${
                                        isSelected ? styles.selected : ''
                                    }`

                                    return (
                                        <button
                                            key={option.value}
                                            type='button'
                                            className={buttonClasses}
                                            onClick={() =>
                                                handleCultureListClick(culturesSelectId, option.value, option.label)
                                            }>
                                            {option.label}
                                        </button>
                                    )
                                })}
                        </div>
                    </div>

                    <div className={styles.selectedCulturesContainer}>
                        <h3 className={styles.selectedCulturesTitle}>Selecionadas</h3>
                        <div className={styles.selectedCultures}>
                            {selectedCultures[culturesSelectId] &&
                                selectedCultures[culturesSelectId].map((culture: any, index) => (
                                    <button
                                        key={`${culture.id}-${index}`}
                                        type='button'
                                        className={styles.selectedItem}
                                        onClick={() => handleRemoveCulture(culturesSelectId, culture.value)}>
                                        {culture.label}
                                    </button>
                                ))}
                        </div>
                    </div>
                </GeralModal>
            </Suspense>
        </GeralTable>
    )
}
