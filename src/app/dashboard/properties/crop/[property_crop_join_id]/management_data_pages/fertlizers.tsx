import dropdownStyles from '@/app/dashboard/styles.module.scss'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import tableStyles from '@/components/tables/styles.module.scss'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { ChangeEvent, FC, MouseEvent, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../../../styles.module.scss'
import { Crop, Product } from '../../../types'

// Lazy Components
import GeralModal from '@/components/modal/GeralModal'

import GeralTable from '@/components/tables/GeralTable'
import { formatNumberToBR } from '@/utils/formats'
import { getMetricUnity } from '@/utils/getMetricUnity'
import validateDate from '@/utils/validateDate'
interface RowDataType {
    id: number
    date?: string
    product_id: number
    dosage: string
    systemLog?: any
}

interface RowAddDataType {
    id: number
    date?: string
    products_id: number[]
    dosages: string[]
}

interface InputsRowsProps {
    newRow: boolean
    setNewRow: (newRow: boolean) => void
    propertyCropJoinId: number
    crop: Crop | undefined
}

const tableHeaders = ['Data', 'Produto', `Dose/${getMetricUnity()}`, 'Total', 'Ações']
const updateStatusRoute = '/api/properties/management-data/delete/fertilizer'

function InputsRows({ newRow, setNewRow, propertyCropJoinId, crop }: InputsRowsProps) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(
        `/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/fertilizer`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteCultureModal, setShowDeleteCultureModal] = useState(false)
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})
    const [rowAddData, setRowAddData] = useState<RowAddDataType>({} as RowAddDataType)

    const [products, setProducts] = useState<Product[]>([])

    const deleteSeed = async () => {
        try {
            setToast({ text: `Excluindo fertilizante`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteCultureModal(false)

                setToast({ text: `Fertilizante excluído`, state: 'success' })
                mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/fertilizer`)
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

    const isObjectValid = (data: RowDataType) => {
        for (const key of Object.keys(data) as Array<keyof RowDataType>) {
            // Pular a verificação para campos opcionais
            if (['product_id', 'id', 'dosage'].includes(key)) continue

            // Verificar se o campo está indefinido ou nulo
            if (data[key] == undefined || data[key] == null) {
                return false
            }

            // Verificar se o campo é uma string e está vazio
            if (data[key] == '' || data[key] == '0') {
                return false
            }
        }
        return true
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
        const newItem = rowAddData.products_id
        const newDosage = rowAddData.dosages

        newItem.push(0)
        newDosage.push('0')

        setRowAddData((prevStates) => ({
            ...prevStates,
            products_id: newItem,
            dosages: newDosage,
        }))
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
                    text: `${id == 0 ? 'Criando' : 'Atualizando'} fertilizante`,
                    state: 'loading',
                })

                const body = id == 0 ? rowAddData : rowData[id]

                axios
                    .post('/api/properties/management-data/form', {
                        ...body,
                        id,
                        admin_id: admin.id,
                        type: 'fertilizer',
                        properties_crops_id: propertyCropJoinId,
                    })
                    .then((response) => {
                        if (response.status == 200) {
                            setToast({
                                text: `Fertilizante ${id == 0 ? 'criado' : 'atualizado'}`,
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
                                    products_id: [0],
                                    dosages: ['0'],
                                })

                                setNewRow(false)
                            }

                            mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/fertilizer`)
                        }
                    })
            } else {
                setToast({ text: 'Preencha todos os campos para continuar', state: 'info' })
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
            data.management_data.forEach((fertilizer: any) => {
                initialEditState[fertilizer.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            setRowAddData({
                id: 0,
                date: '',
                products_id: [0],
                dosages: ['0'],
            })

            setProducts([])

            data.products.forEach((product: Product) => {
                setProducts((prevStates) => [...prevStates, product])
            })

            data.management_data.forEach((fertilizer: any) => {
                initialFormState[fertilizer.id] = {
                    id: fertilizer.id,
                    date: fertilizer.date,
                    product_id: fertilizer.product_id,
                    dosage: formatNumberToBR(fertilizer.dosage),
                    systemLog: fertilizer.system_log,
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
                        <TableRow gridColumns={`0.7fr 1fr 1fr 1fr 0.5fr`}>
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
                            <div></div>
                            <div></div>
                            <div></div>
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
                            gridColumns={`0.7fr 1fr 1fr 1fr 0.5fr`}>
                            {rowAddData?.products_id?.map((productId: number, index: number) => (
                                <TableRow
                                    gridColumns={`0.7fr 1fr 1fr 1fr 0.5fr`}
                                    key={`products_id-row-${index}-${productId}`}>
                                    <div></div>
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

                                            {products.map((product) => (
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
                                            defaultValue={rowAddData?.dosages[index]}
                                            variant='inline'
                                            name='dosages'
                                            decimalScale={3}
                                            type='text'
                                            maskVariant='price'
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                handleArrayInputChange(event, index)
                                            }
                                            required
                                        />
                                    </div>
                                    <div data-type='content'>
                                        {crop
                                            ? formatNumberToBR(
                                                  parseFloat(
                                                      rowAddData.dosages[index].replace('.', '').replace(',', '.'),
                                                  ) * crop?.used_area!,
                                              ).replace(',00', '')
                                            : '--'}
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
                            <TableRow gridColumns={`0.7fr 1fr 1fr 1fr 0.5fr`}>
                                <div></div>
                                <div>
                                    <GeralButton type='button' variant='inlineGreen' onClick={() => addItem()}>
                                        + Adicionar produto
                                    </GeralButton>
                                </div>
                                <div></div>
                                <div></div>
                                <div data-type='action'></div>
                            </TableRow>
                        </GeralTable>
                    </div>
                </div>
            )}

            {data.management_data &&
                data.management_data.map((fertilizer: any) => (
                    <TableRow key={fertilizer.id} gridColumns={`0.7fr 1fr 1fr 1fr 0.5fr`}>
                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='date'
                                type='date'
                                defaultValue={rowData[fertilizer.id]?.date}
                                readOnly={!rowEdit[fertilizer.id]}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[fertilizer.id]?.id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                readOnly={!rowEdit[fertilizer.id]}
                                defaultValue={rowData[fertilizer.id]?.product_id}
                                variant='inline'
                                name='product_id'
                                type='select'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[fertilizer.id]?.id)
                                }
                                required>
                                <option value='0' disabled>
                                    Selecione
                                </option>

                                {products.map((product) => (
                                    <option
                                        key={product.id}
                                        value={product.id}
                                        selected={rowData[fertilizer.id]?.product_id == product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </GeralInput>
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                readOnly={!rowEdit[fertilizer.id]}
                                variant='inline'
                                name='dosage'
                                decimalScale={3}
                                maskVariant='price'
                                defaultValue={rowData[fertilizer.id]?.dosage}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[fertilizer.id]?.id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            {crop
                                ? formatNumberToBR(
                                      parseFloat(
                                          rowData[fertilizer.id]?.dosage.toString().replace('.', '').replace(',', '.'),
                                      ) * crop?.used_area!,
                                  ).replace(',00', '')
                                : '--'}
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                {rowData[fertilizer.id]?.systemLog && rowData[fertilizer.id]?.systemLog?.admin && (
                                    <TableButton
                                        variant='user'
                                        onClick={() => {}}
                                        title={`Responsável: ${
                                            rowData[fertilizer.id].systemLog?.admin
                                                ? rowData[fertilizer.id].systemLog?.admin?.name
                                                : '--'
                                        }`}
                                    />
                                )}

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
                                                [fertilizer.id]: !prevStates[fertilizer.id],
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
                    <TableRow emptyString='Nenhum fertilizante encontrado' columnsCount={1} />
                ))}

            <GeralModal
                small
                isDelete
                deleteName='o fertilizante'
                deleteFunction={deleteSeed}
                show={showDeleteCultureModal}
                setShow={setShowDeleteCultureModal}
                title='Excluir fertilizante'
            />
        </>
    )
}

interface FertilizersProps {
    propertyCropJoinId: number
    crop: Crop | undefined
}

const Fertilizers: FC<FertilizersProps> = ({ propertyCropJoinId, crop }) => {
    const [newRow, setNewRow] = useState(false)

    return (
        <>
            <div className={`${styles.managementDataHeader} ${styles.desktop}`}>
                <p>Todos os fertilizantes</p>

                <GeralButton
                    smaller
                    smallIcon
                    value={`Adicionar fertilizante`}
                    variant='secondary'
                    onClick={() => {
                        setNewRow(!newRow)
                    }}>
                    <IconifyIcon icon='ph:plus' />
                </GeralButton>
            </div>
            <div className={`${styles.managementDataHeader} ${styles.mobile}`}>
                <p>Todos</p>

                <GeralButton
                    smaller
                    smallIcon
                    value={`Fertilizante`}
                    variant='secondary'
                    onClick={() => {
                        setNewRow(!newRow)
                    }}>
                    <IconifyIcon icon='ph:plus' />
                </GeralButton>
            </div>

            <GeralTable
                headers={tableHeaders}
                customClasses={[tableStyles.boxWidth]}
                gridColumns={`0.7fr 1fr 1fr 1fr 0.5fr`}>
                <Suspense fallback={<TableSkeleton />}>
                    <InputsRows
                        crop={crop}
                        newRow={newRow}
                        setNewRow={setNewRow}
                        propertyCropJoinId={propertyCropJoinId}
                    />
                </Suspense>
            </GeralTable>
        </>
    )
}

export default Fertilizers
