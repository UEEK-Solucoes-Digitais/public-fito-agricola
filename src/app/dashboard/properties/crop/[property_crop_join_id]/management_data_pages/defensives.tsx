import dropdownStyles from '@/app/dashboard/styles.module.scss'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import validateDate from '@/utils/validateDate'
import axios from 'axios'
import { ChangeEvent, FC, MouseEvent, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../../../styles.module.scss'
import { Crop, Product } from '../../../types'

interface RowDataType {
    id: number
    date?: string
    defensive_type: number
    product_id: number
    dosage: string
    systemLog?: any
}

interface RowAddDataType {
    id: number
    date?: string
    defensives_types: number[]
    products_id: number[]
    dosages: string[]
}

interface InputsRowsProps {
    newRow: boolean
    setNewRow: (newRow: boolean) => void
    propertyCropJoinId: number
    crop?: Crop
}

const tableHeaders = ['Data', 'N•', 'Tipo de insumo', 'Produto', 'Dose', 'Total', 'Ações']
const updateStatusRoute = '/api/properties/management-data/delete/defensive'

function InputsRows({ newRow, setNewRow, propertyCropJoinId, crop }: InputsRowsProps) {
    const { setToast } = useNotification()

    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(
        `/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/defensive`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteCultureModal, setShowDeleteCultureModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})
    const [rowAddData, setRowAddData] = useState<RowAddDataType>({} as RowAddDataType)

    const [products, setProducts] = useState<Product[]>([])

    const deleteSeed = async () => {
        try {
            setToast({ text: `Excluindo defensivo ${deleteName}`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteCultureModal(false)

                setToast({ text: `Defensivo ${deleteName} excluída`, state: 'success' })
                mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/defensive`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const handleUserInputChange = async (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        id: any,
        type: number = 1,
    ) => {
        const { name, value } = e.target

        if (type == 1) {
            setRowData((prevStates) => ({
                ...prevStates,
                [id]: { ...prevStates[id], [name]: value },
            }))
        } else {
            setRowAddData((prevStates) => ({
                ...prevStates,
                [name]: value,
            }))
        }
    }

    const handleArrayInputChange = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        const { name, value } = e.target

        const itens = rowAddData[name as keyof RowAddDataType]

        if (Array.isArray(itens)) {
            itens[index] = value

            setRowAddData((prevStates) => ({
                ...prevStates,
                [name]: itens,
            }))
        }
    }

    const removeItem = (index: number, name: string) => {
        const newItem = rowAddData[name as keyof RowAddDataType]
        if (Array.isArray(newItem)) {
            newItem.splice(index, 1)

            setRowAddData((prevStates) => ({
                ...prevStates,
                [name]: newItem,
            }))
        }
    }

    const addItem = () => {
        setRowAddData((prevStates) => ({
            ...prevStates,
            products_id: [...prevStates.products_id, 0],
            dosages: [...prevStates.dosages, '0'],
            defensives_types: [...prevStates.defensives_types, 1],
        }))
    }

    const isObjectValid = (data: RowDataType) => {
        for (const key of Object.keys(data) as Array<keyof RowDataType>) {
            if (['defensive_type', 'id', 'dosage'].includes(key)) continue

            if (data[key] == undefined || data[key] == null) {
                return false
            }

            if (data[key] == '' || data[key] == '0') {
                return false
            }
        }
        return true
    }

    const isAddObjectValid = (data: RowAddDataType) => {
        for (const key of Object.keys(data) as Array<keyof RowAddDataType>) {
            if (['defensive_type', 'id', 'products_id', 'dosages'].includes(key)) continue

            if (data[key] == undefined || data[key] == null) {
                return false
            }

            if (data[key] == '' || data[key] == '0') {
                return false
            }
        }

        if (data.products_id.length == 0) {
            return false
        }

        if (data.dosages.length == 0) {
            return false
        }

        return true
    }

    const confirmSubmit = (id: number) => {
        try {
            if (!validateDate(id == 0 ? rowAddData.date! : rowData[id].date!)) {
                setToast({
                    text: `Data inválida`,
                    state: 'danger',
                })
                return false
            }

            if (id == 0 ? isAddObjectValid(rowAddData) : isObjectValid(rowData[id])) {
                setToast({
                    text: `${id == 0 ? 'Criando' : 'Atualizando'} defensivo`,
                    state: 'loading',
                })

                const body = id == 0 ? rowAddData : rowData[id]

                axios
                    .post('/api/properties/management-data/form', {
                        ...body,
                        id,
                        admin_id: admin.id,
                        type: 'defensive',
                        properties_crops_id: propertyCropJoinId,
                    })
                    .then((response) => {
                        if (response.status == 200) {
                            setToast({
                                text: `Defensivo ${id == 0 ? 'criado' : 'atualizado'}`,
                                state: 'success',
                            })

                            setRowEdit((prevStates) => ({
                                ...prevStates,
                                [id]: !prevStates[id],
                            }))

                            if (id == 0) {
                                setRowAddData({
                                    id: 0,
                                    date: '',
                                    defensives_types: [1],
                                    products_id: [0],
                                    dosages: ['0'],
                                })

                                setNewRow(false)
                            }

                            mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/defensive`)
                        }
                    })
            } else {
                setToast({ text: 'Preencha todos os campos para continuar', state: 'warning' })
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (data && data.management_data) {
            const initialEditState: { [key: number]: boolean } = {}
            data.management_data.forEach((defensive: any) => {
                initialEditState[defensive.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            setRowAddData({
                id: 0,
                date: '',
                defensives_types: [1],
                products_id: [0],
                dosages: ['0'],
            })

            setProducts([])

            data.products.forEach((product: Product) => {
                setProducts((prevStates) => [...prevStates, product])
            })

            data.management_data.forEach((defensive: any) => {
                initialFormState[defensive.id] = {
                    id: defensive.id,
                    date: defensive.date,
                    defensive_type: defensive.product ? defensive.product.object_type : '--',
                    product_id: defensive.product_id,
                    dosage: formatNumberToBR(defensive.dosage),
                    systemLog: defensive.system_log,
                }
            })
            setRowData(initialFormState)
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {newRow && (
                <div className={`${dropdownStyles.withDropdown} ${dropdownStyles.opened}`}>
                    <div className={dropdownStyles.dropdownInfo} style={{ cursor: 'pointer' }}>
                        <TableRow gridColumns={`0.8fr 0.5fr 1fr 1fr repeat(2, 0.4fr) 0.5fr`}>
                            <div data-type='content'>
                                <GeralInput
                                    variant='inline'
                                    name='date'
                                    type='date'
                                    defaultValue={rowAddData?.date}
                                    readOnly={false}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, rowAddData.id, 2)
                                    }
                                />
                            </div>

                            <div>--</div>

                            {/* <div data-type='content'>
                                <GeralInput
                                    readOnly={false}
                                    defaultValue={rowAddData?.defensive_type}
                                    variant='inline'
                                    name='defensive_type'
                                    type='select'
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        handleUserInputChange(event, rowAddData.id, 2)
                                    }
                                    required>
                                        <option value='1'>Adjuvante</option>
                                        <option value='2'>Biológico</option>
                                        <option value='3'>Fertilizante foliar</option>
                                        <option value='4'>Fungicida</option>
                                        <option value='5'>Herbicida</option>
                                        <option value='6'>Inseticida</option>
                                </GeralInput>
                            </div> */}

                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>

                            {/* <div data-type='content'>
                        <GeralInput
                            readOnly={false}
                            defaultValue={0}
                            variant='inline'
                            name='product_id'
                            type='select'
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                            required>
                                <option value='0' disabled>
                                    Selecione
                                </option>

                                {products
                                    .filter((product) => product.object_type == rowAddData?.defensive_type)
                                    .map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                        </GeralInput>
                    </div> */}

                            {/* <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='dosage'
                            decimalScale={3}
                            defaultValue={rowAddData?.dosage}
                            maskVariant='price'
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div>
                        {crop
                            ? formatNumberToBR(rowAddData?.dosage * crop?.used_area!)
                                  .replace(',00', '')
                                  .replace('00', '')
                            : '--'}
                    </div> */}

                            <div data-type='action'>
                                <TableActions>
                                    <GeralButton
                                        variant='secondary'
                                        value='Salvar'
                                        type='button'
                                        smaller
                                        onClick={() => confirmSubmit(0)}
                                    />
                                    <GeralButton
                                        variant='noStyle'
                                        type='button'
                                        onClick={() => {
                                            setNewRow(false)
                                        }}>
                                        <IconifyIcon icon='ph:x' />
                                    </GeralButton>
                                </TableActions>
                            </div>
                        </TableRow>
                    </div>
                    <div className={`${dropdownStyles.dropdownMenu} ${dropdownStyles.panelDropdown}`}>
                        <GeralTable
                            customClasses={[tableStyles.dropdownPanel, tableStyles.boxWidth]}
                            headers={[]}
                            gridColumns={`0.8fr 0.5fr 1fr 1fr repeat(2, 0.4fr) 0.5fr`}>
                            {rowAddData?.products_id?.map((productId: number, index: number) => (
                                <TableRow
                                    gridColumns={`0.8fr 0.5fr 1fr 1fr repeat(2, 0.4fr) 0.5fr`}
                                    key={`products_id-row-0-${productId}`}>
                                    <div></div>
                                    <div></div>
                                    <div data-type='content'>
                                        <GeralInput
                                            readOnly={false}
                                            variant='inline'
                                            name='defensives_types'
                                            type='select'
                                            defaultValue={rowAddData?.defensives_types[index]}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                handleArrayInputChange(event, index)
                                            }
                                            required>
                                            <option value='1'>Adjuvante</option>
                                            <option value='2'>Biológico</option>
                                            <option value='3'>Fertilizante foliar</option>
                                            <option value='4'>Fungicida</option>
                                            <option value='5'>Herbicida</option>
                                            <option value='6'>Inseticida</option>
                                        </GeralInput>
                                    </div>
                                    <div data-type='content'>
                                        <GeralInput
                                            readOnly={false}
                                            defaultValue={rowAddData?.products_id[index]}
                                            variant='inline'
                                            name='products_id'
                                            type='select'
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                handleArrayInputChange(event, index)
                                            }
                                            required>
                                            <option value='0' disabled>
                                                Selecione
                                            </option>

                                            {products
                                                .filter(
                                                    (product) =>
                                                        product.object_type == rowAddData?.defensives_types[index],
                                                )
                                                .map((product) => (
                                                    <option
                                                        key={product.id}
                                                        value={product.id}
                                                        selected={product.id == productId}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                        </GeralInput>
                                    </div>
                                    <div data-type='content'>
                                        <GeralInput
                                            readOnly={false}
                                            variant='inline'
                                            name='dosages'
                                            type='text'
                                            decimalScale={3}
                                            maskVariant='price'
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                handleArrayInputChange(event, index)
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <div>
                                            {crop
                                                ? formatNumberToBR(
                                                      parseFloat(
                                                          rowAddData?.dosages[index]
                                                              .toString()
                                                              .replace('.', '')
                                                              .replace(',', '.'),
                                                      ) * crop?.used_area!,
                                                  )
                                                      .replace(',00', '')
                                                      .replace('00', '')
                                                : '--'}
                                        </div>
                                    </div>
                                    <div data-type='action'>
                                        {rowAddData?.products_id?.length > 1 && (
                                            <TableActions>
                                                <TableButton
                                                    variant='delete'
                                                    onClick={(
                                                        event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
                                                    ) => {
                                                        event.stopPropagation()
                                                        removeItem(index, 'products_id')
                                                    }}
                                                />
                                            </TableActions>
                                        )}
                                    </div>
                                </TableRow>
                            ))}
                            <TableRow gridColumns={`0.8fr 0.5fr 1fr 1fr repeat(2, 0.4fr) 0.5fr`}>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div>
                                    <GeralButton type='button' variant='inlineGreen' onClick={addItem}>
                                        + Adicionar produto
                                    </GeralButton>
                                </div>
                                <div data-type='action'></div>
                            </TableRow>
                        </GeralTable>
                    </div>
                </div>
            )}

            {data.management_data &&
                data.management_data.map((defensive: any) => (
                    <TableRow
                        key={defensive.id}
                        gridColumns={`0.8fr 0.5fr 1fr 1fr repeat(2, 0.4fr) 0.5fr`}
                        customClasses={defensive?.application_number % 2 == 0 ? [tableStyles.sort] : []}>
                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='date'
                                type='date'
                                defaultValue={rowData[defensive.id]?.date}
                                readOnly={!rowEdit[defensive.id]}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[defensive.id].id)
                                }
                            />
                        </div>

                        <div>{defensive?.application_number ?? '--'}</div>

                        <div data-type='content'>
                            <GeralInput
                                readOnly={!rowEdit[defensive.id]}
                                defaultValue={rowData[defensive.id]?.defensive_type}
                                variant='inline'
                                name='defensive_type'
                                type='select'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[defensive.id].id)
                                }
                                required>
                                <option value='1' selected={rowData[defensive.id]?.defensive_type == 1}>
                                    Adjuvante
                                </option>
                                <option value='2' selected={rowData[defensive.id]?.defensive_type == 2}>
                                    Biológico
                                </option>
                                <option value='3' selected={rowData[defensive.id]?.defensive_type == 3}>
                                    Fertilizante foliar
                                </option>
                                <option value='4' selected={rowData[defensive.id]?.defensive_type == 4}>
                                    Fungicida
                                </option>
                                <option value='5' selected={rowData[defensive.id]?.defensive_type == 5}>
                                    Herbicida
                                </option>
                                <option value='6' selected={rowData[defensive.id]?.defensive_type == 6}>
                                    Inseticida
                                </option>
                            </GeralInput>
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                readOnly={!rowEdit[defensive.id]}
                                defaultValue={rowData[defensive.id]?.product_id}
                                variant='inline'
                                name='product_id'
                                type='select'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[defensive.id].id)
                                }
                                required>
                                <option value='0'>Selecione</option>

                                {products
                                    .filter(
                                        (product) =>
                                            product.object_type?.toString() ==
                                            rowData[defensive.id]?.defensive_type.toString(),
                                    )
                                    .map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                            selected={rowData[defensive.id]?.product_id == product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                            </GeralInput>
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                readOnly={!rowEdit[defensive.id]}
                                variant='inline'
                                name='dosage'
                                decimalScale={3}
                                defaultValue={rowData[defensive.id]?.dosage}
                                maskVariant='price'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[defensive.id].id)
                                }
                            />
                        </div>
                        <div>
                            {crop
                                ? formatNumberToBR(
                                      parseFloat(
                                          rowData[defensive.id]?.dosage.toString().replace('.', '').replace(',', '.'),
                                      ) * crop?.used_area!,
                                  ).replace(',00', '')
                                : '--'}
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                {rowData[defensive.id]?.systemLog && rowData[defensive.id]?.systemLog?.admin && (
                                    <TableButton
                                        variant='user'
                                        onClick={() => {}}
                                        title={`Responsável: ${
                                            rowData[defensive.id].systemLog?.admin
                                                ? rowData[defensive.id].systemLog?.admin?.name
                                                : '--'
                                        }`}
                                    />
                                )}
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
                                            setDeleteName('defensivo')
                                            setShowDeleteCultureModal(!showDeleteCultureModal)
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
                                        }}>
                                        <IconifyIcon icon='ph:x' />
                                    </GeralButton>
                                )}
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            {!data.management_data ||
                (data.management_data.length == 0 && (
                    <TableRow emptyString='Nenhum defensivo encontrado' columnsCount={1} />
                ))}

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteSeed}
                show={showDeleteCultureModal}
                setShow={setShowDeleteCultureModal}
                title='Excluir defensivo'
            />
        </>
    )
}

interface DefensivesProps {
    propertyCropJoinId: number
    crop?: Crop
}

const Defensives: FC<DefensivesProps> = ({ propertyCropJoinId, crop }) => {
    const [newRow, setNewRow] = useState(false)
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const [showExportModal, setExportModal] = useState(false)

    async function exportDefensives(type: number) {
        const newUrl = `/api/reports/list/${admin.id}/defensives?export=true&export_type=${type}&property_crop_join_id=${propertyCropJoinId}`

        setToast({ text: `Requisitando arquivo, aguarde`, state: 'loading' })

        const response = await axios.get(newUrl)

        if (response.data.status == 200 && response.data.file_dump) {
            const fileUrl = response.data.file_dump
            setToast({ text: `O download será iniciado em instantes`, state: 'success' })

            if (typeof window != 'undefined') {
                window.open(fileUrl, '_blank')
            }

            // const fileDownloadResponse = await axios.get(fileUrl, { responseType: 'blob' });
            // saveAs(fileDownloadResponse.data, 'Exportação.xlsx');
        } else {
            setToast({ text: response.data.msg || 'Não foi possível iniciar o download', state: 'danger' })
        }
    }

    return (
        <>
            <div className={`${styles.managementDataHeader} ${styles.desktop}`}>
                <p>Todos os defensivos</p>

                <div className={styles.buttonActions}>
                    <GeralButton
                        smaller
                        smallIcon
                        value={`Exportar PDF`}
                        variant='tertiary'
                        onClick={() => exportDefensives(2)}
                    />
                    <GeralButton
                        smaller
                        smallIcon
                        value={`Exportar XLSX`}
                        variant='tertiary'
                        onClick={() => exportDefensives(1)}
                    />
                    <GeralButton
                        smaller
                        smallIcon
                        value={`Adicionar defensivo`}
                        variant='secondary'
                        onClick={() => {
                            setNewRow(!newRow)
                        }}>
                        <IconifyIcon icon='ph:plus' />
                    </GeralButton>
                </div>
            </div>
            <div className={`${styles.managementDataHeader} ${styles.mobile}`}>
                <p>Todos</p>

                <div className={styles.buttonActions}>
                    <GeralButton round variant='tertiary' onClick={() => setExportModal(true)}>
                        <IconifyIcon icon='ph:arrow-square-out' />
                    </GeralButton>
                    <GeralButton
                        smaller
                        smallIcon
                        value={`Defensivo`}
                        variant='secondary'
                        onClick={() => {
                            setNewRow(!newRow)
                        }}>
                        <IconifyIcon icon='ph:plus' />
                    </GeralButton>
                </div>
            </div>

            <GeralTable
                headers={tableHeaders}
                customClasses={[tableStyles.boxWidth]}
                gridColumns={`0.8fr 0.5fr 1fr 1fr repeat(2, 0.4fr) 0.5fr`}>
                <Suspense fallback={<TableSkeleton />}>
                    <InputsRows
                        newRow={newRow}
                        setNewRow={setNewRow}
                        propertyCropJoinId={propertyCropJoinId}
                        crop={crop}
                    />
                </Suspense>
            </GeralTable>

            <GeralModal title='Exportar' show={showExportModal} setShow={setExportModal}>
                <div className={styles.modalContent}>
                    <GeralButton value={`Exportar PDF`} variant='tertiary' onClick={() => exportDefensives(2)}>
                        <IconifyIcon icon='ph:arrow-square-out' />
                    </GeralButton>
                    <GeralButton value={`Exportar XLSX`} variant='tertiary' onClick={() => exportDefensives(1)}>
                        <IconifyIcon icon='ph:arrow-square-out' />
                    </GeralButton>
                </div>
            </GeralModal>
        </>
    )
}

export default Defensives
