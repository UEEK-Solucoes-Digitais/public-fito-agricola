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
import { getMetricUnity } from '@/utils/getMetricUnity'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import validateDate from '@/utils/validateDate'
import axios from 'axios'
import { ChangeEvent, FC, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../../../styles.module.scss'
import { Crop, Product } from '../../../types'

interface RowDataType {
    id: number
    product_id: number
    properties_crops_id: number
    cost_per_kilogram: number
    kilogram_per_ha: number
    spacing: number
    seed_per_linear_meter: number
    seed_per_square_meter: number
    pms: number
    quantity_per_ha: number
    date: string
    culture_code?: string
    area: number
    systemLog?: any
}

interface InputsRowsProps {
    newRow: boolean
    setNewRow: (newRow: boolean) => void
    totalArea: number
    setTotalArea: (newArea: number) => void
    propertyCropJoinId: number
    crop: Crop | undefined
    setCrop: any
}

const tableHeaders = [
    'Cultura',
    'Cultivar',
    'Data',
    'Área',
    // 'Custo/KG',
    `Kg/${getMetricUnity()}`,
    'Espaçamento (m)',
    'Semente/m',
    'PMS',
    'Sementes/m2',
    `Qtd/${getMetricUnity()}`,
    'Ações',
]

const updateStatusRoute = '/api/properties/management-data/delete/seed'

function InputsRows({
    newRow,
    setNewRow,
    propertyCropJoinId,
    crop,
    totalArea,
    setTotalArea,
    setCrop,
}: InputsRowsProps) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(
        `/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/seed`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteCultureModal, setShowDeleteCultureModal] = useState(false)
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})
    const [oldRowData, setOldRowData] = useState<{ [key: number]: RowDataType }>({})
    const [products, setProducts] = useState<Product[]>([])

    const deleteSeed = async () => {
        try {
            setToast({ text: `Excluindo semente `, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteCultureModal(false)

                setToast({ text: `Semente  excluída`, state: 'success' })
                mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/seed`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const handleUserInputChange = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: any) => {
        const { name, value } = e.target
        setRowData((prevStates) => ({
            ...prevStates,
            [id]: { ...prevStates[id], [name]: value },
        }))

        if (name == 'product_id') {
            // setando product_code para vazio
            setRowData((prevStates) => ({
                ...prevStates,
                [id]: { ...prevStates[id], culture_code: '' },
            }))
        }
        // } else
        if (name == 'seed_per_linear_meter' || name == 'spacing') {
            const linear = parseFloat(
                (name == 'seed_per_linear_meter' ? value : rowData[id]?.seed_per_linear_meter)
                    .toString()
                    .replace(',', '.'),
            )
            const spacing = parseFloat(
                (name == 'spacing' ? value : (rowData[id]?.spacing as any)).toString().replace(',', '.'),
            )

            setRowData((prevStates) => ({
                ...prevStates,
                [id]: {
                    ...prevStates[id],
                    seed_per_square_meter: linear > 0 && spacing > 0 ? linear / spacing : 0,
                },
            }))

            setRowData((prevStates) => ({
                ...prevStates,
                [id]: {
                    ...prevStates[id],
                    quantity_per_ha:
                        parseFloat(rowData[id]?.seed_per_square_meter.toString().replace(',', '.')) * 10000,
                },
            }))
        }
    }

    const isObjectValid = (data: RowDataType) => {
        for (const key of Object.keys(data) as Array<keyof RowDataType>) {
            // Pular a verificação para campos opcionais
            if (
                [
                    'properties_crops_id',
                    'cost_per_kilogram',
                    'kilogram_per_ha',
                    'spacing',
                    'seed_per_linear_meter',
                    'seed_per_square_meter',
                    'pms',
                    'quantity_per_ha',
                    'id',
                ].includes(key)
            )
                continue

            // Verificar se o campo está indefinido ou nulo
            if (data[key] == undefined || data[key] == null) {
                setToast({ text: 'Preencha todos os campos para continuar', state: 'info' })
                return false
            }

            // Verificar se o campo é uma string e está vazio
            if (data[key] == '') {
                setToast({ text: 'Preencha todos os campos para continuar', state: 'info' })
                return false
            }
        }
        return true
    }

    function isAreaValid() {
        let totalArea = 0

        Object.keys(rowData).forEach((key, index) => {
            if (index != 0 || (index == 0 && newRow)) {
                totalArea += parseFloat(rowData[parseInt(key)].area.toString().replace(',', '.'))
            }
        })

        if (crop && totalArea > parseFloat(crop?.area)) {
            setToast({
                text: `A área total das sementes não pode ser maior que a área da lavoura (${formatNumberToBR(
                    crop.area,
                )} ${getMetricUnity()})`,
                state: 'info',
            })
            return false
        }

        return true
    }

    const confirmSubmit = (id: number) => {
        try {
            if (parseFloat(rowData[id]?.spacing.toString()) > 1) {
                setToast({
                    text: `O espaçamento não pode ser maior que 1`,
                    state: 'info',
                })
                return
            }

            if (!validateDate(rowData[id]?.date)) {
                setToast({
                    text: `Data inválida`,
                    state: 'danger',
                })
                return
            }

            if (isObjectValid(rowData[id]) && isAreaValid()) {
                setToast({
                    text: `${id == 0 ? 'Criando' : 'Atualizando'} semente`,
                    state: 'loading',
                })

                axios
                    .post('/api/properties/management-data/form', {
                        ...rowData[id],
                        id,
                        admin_id: admin.id,
                        type: 'seed',
                        properties_crops_id: propertyCropJoinId,
                    })
                    .then((response) => {
                        if (response.status == 200) {
                            setToast({
                                text: `Semente ${id == 0 ? 'criada' : 'atualizada'}`,
                                state: 'success',
                            })

                            setRowEdit((prevStates) => ({
                                ...prevStates,
                                [id]: !prevStates[id],
                            }))

                            if (id == 0) {
                                setCrop((prevStates: Crop) => ({
                                    ...prevStates,
                                    used_area: crop?.used_area
                                        ? crop?.used_area + parseFloat(rowData[0]?.area.toString())
                                        : parseFloat(rowData[0]?.area.toString()),
                                }))

                                setRowData((prevStates) => ({
                                    ...prevStates,
                                    0: {
                                        id: 0,
                                        product_id: 0,
                                        properties_crops_id: propertyCropJoinId,
                                        cost_per_kilogram: 0,
                                        kilogram_per_ha: 0,
                                        spacing: 0,
                                        seed_per_linear_meter: 0,
                                        seed_per_square_meter: 0,
                                        pms: 0,
                                        quantity_per_ha: 0,
                                        date: '--',
                                        culture_code: '--',
                                        culture_name: '--',
                                        area: crop?.area
                                            ? parseFloat(crop?.area) - totalArea >= 0
                                                ? parseFloat(crop?.area) - totalArea
                                                : 0
                                            : 0,
                                    },
                                }))

                                setNewRow(false)
                            } else {
                                setCrop((prevStates: Crop) => ({
                                    ...prevStates,
                                    used_area: crop?.used_area
                                        ? crop?.used_area +
                                          parseFloat(rowData[id]?.area.toString()) -
                                          parseFloat(oldRowData[id]?.area.toString())
                                        : parseFloat(rowData[id]?.area.toString()) -
                                          parseFloat(oldRowData[id]?.area.toString()),
                                }))
                            }

                            mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/seed`)
                        }
                    })
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
            data.management_data.forEach((seed: any) => {
                initialEditState[seed.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            initialFormState[0] = {
                id: 0,
                product_id: 0,
                properties_crops_id: propertyCropJoinId,
                cost_per_kilogram: 0,
                kilogram_per_ha: 0,
                spacing: 0,
                seed_per_linear_meter: 0,
                seed_per_square_meter: 0,
                pms: 0,
                quantity_per_ha: 0,
                date: '--',
                culture_code: '--',
                area: 0,
            }

            setProducts([])

            data.products.forEach((product: Product) => {
                setProducts((prevStates) => [...prevStates, product])
            })

            let totalAreaCurrent: number = 0

            data.management_data.forEach((seed: any) => {
                totalAreaCurrent = totalAreaCurrent + parseFloat(seed.area)

                initialFormState[seed.id] = {
                    id: seed.id,
                    product_id: seed.product_id,
                    properties_crops_id: seed.properties_crops_id,
                    cost_per_kilogram: seed.cost_per_kilogram,
                    kilogram_per_ha: seed.kilogram_per_ha,
                    spacing: seed.spacing,
                    seed_per_linear_meter: seed.seed_per_linear_meter,
                    seed_per_square_meter: seed.seed_per_square_meter,
                    pms: seed.pms,
                    quantity_per_ha: seed.quantity_per_ha,
                    date: seed.date,
                    // stock_incoming: seed.stock_incoming,
                    culture_code: seed.product_variant ? seed.product_variant : '--',
                    area: seed.area ?? crop?.area ?? 0,
                    systemLog: seed.system_log,
                }
            })
            setTotalArea(totalAreaCurrent)

            initialFormState[0].area = crop?.area
                ? parseFloat(crop?.area) - totalAreaCurrent >= 0
                    ? parseFloat(crop?.area) - totalAreaCurrent
                    : 0
                : 0

            setRowData(initialFormState)
            setOldRowData(initialFormState)
        }
    }, [data, propertyCropJoinId])

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
                <TableRow gridColumns={`1fr 1.1fr 1.3fr 0.5fr 0.5fr 1fr 1fr 0.7fr 1.2fr 1fr 1fr`}>
                    {/*

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='dosage'
                            defaultValue={rowData[0]?.dosage}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div> */}

                    <div data-type='content'>
                        <GeralInput
                            readOnly={false}
                            defaultValue={rowData[0]?.product_id}
                            variant='inline'
                            name='product_id'
                            type='select'
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                            required>
                            <option value={0}>Selecione</option>

                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </GeralInput>
                    </div>

                    <div data-type='content'>
                        <GeralInput
                            readOnly={false}
                            defaultValue={rowData[0]?.culture_code}
                            variant='inline'
                            name='culture_code'
                            type='select'
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                            required>
                            <option value={0}>Selecione</option>

                            {rowData[0] &&
                                products
                                    .filter((item) => item.id == parseFloat(rowData[0]?.product_id.toString()))
                                    .map((item) =>
                                        item.extra_column
                                            ?.split(',')
                                            .sort()
                                            .map((variety: string) => (
                                                <option key={`${item.id}-${variety}`} value={variety}>
                                                    {variety}
                                                </option>
                                            )),
                                    )}

                            {/* {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))} */}
                        </GeralInput>
                    </div>

                    {/* <div data-type='content'>--</div> */}
                    {/* <div data-type='content'>{rowData[0].culture_code}</div> */}

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='date'
                            type='date'
                            defaultValue={rowData[0]?.date}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='area'
                            maskVariant='price'
                            defaultValue={rowData[0]?.area}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    {/* <div data-type='content'>{rowData[0].cost_per_kilogram}</div> */}

                    {/* <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='cost_per_kilogram'
                            maskVariant='price'
                            defaultValue={rowData[0]?.cost_per_kilogram}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                handleUserInputChange(event, rowData[0].id)
                            }
                        />
                    </div> */}

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='kilogram_per_ha'
                            maskVariant='price'
                            defaultValue={rowData[0]?.kilogram_per_ha}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='spacing'
                            maskVariant='price'
                            defaultValue={rowData[0]?.spacing}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='seed_per_linear_meter'
                            maskVariant='price'
                            defaultValue={rowData[0]?.seed_per_linear_meter}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='pms'
                            maskVariant='price'
                            defaultValue={rowData[0]?.pms}
                            readOnly={false}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>{formatNumberToBR(rowData[0]?.seed_per_square_meter, 2)}</div>

                    <div data-type='content'>
                        {formatNumberToBR(rowData[0]?.seed_per_square_meter * 10000).split(',')[0]}
                    </div>

                    <div data-type='action'>
                        <TableActions>
                            <GeralButton variant='noStyle' type='button' onClick={() => confirmSubmit(0)}>
                                <IconifyIcon icon='lucide:check-circle-2' />
                            </GeralButton>
                            <GeralButton
                                variant='noStyle'
                                type='button'
                                smaller
                                onClick={() => {
                                    setNewRow(false)
                                }}>
                                <IconifyIcon icon='ph:x' />
                            </GeralButton>
                        </TableActions>
                    </div>
                </TableRow>
            )}

            {data.management_data &&
                data.management_data.map((seed: any) => (
                    <TableRow key={seed.id} gridColumns={`1fr 1.1fr 1.3fr 0.5fr 0.5fr 1fr 1fr 0.7fr 1.2fr 1fr 1fr`}>
                        <div data-type='content'>
                            <GeralInput
                                readOnly={!rowEdit[seed.id]}
                                defaultValue={rowData[seed.id]?.product_id}
                                variant='inline'
                                name='product_id'
                                type='select'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id]?.id)
                                }
                                required>
                                <option value={0}>Selecione</option>

                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </GeralInput>
                        </div>

                        {/* <div data-type='content'>
                            <GeralInput
                                readOnly={rowEdit[seed.id] ? false : true}
                                variant='inline'
                                name='dosage'
                                defaultValue={rowData[seed.id]?.dosage}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id].id)
                                }
                            />
                        </div>

                      */}
                        {/* <div data-type='content'>--</div> */}

                        <GeralInput
                            readOnly={!rowEdit[seed.id]}
                            defaultValue={rowData[seed.id]?.culture_code}
                            variant='inline'
                            name='culture_code'
                            type='select'
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                handleUserInputChange(event, rowData[seed.id]?.id)
                            }
                            required>
                            {/* <option value={0} disabled>
                                    Selecione
                                </option> */}

                            <option value={0}>Selecione</option>

                            {rowData[seed.id] &&
                                products
                                    .filter((item) =>
                                        rowData[seed.id]?.product_id
                                            ? item.id == parseFloat(rowData[seed.id]?.product_id.toString())
                                            : item,
                                    )
                                    .map((item) =>
                                        item.extra_column
                                            ?.split(',')
                                            .sort()
                                            .map((variety: string) => (
                                                <option key={`${item.id}-${variety}`} value={variety}>
                                                    {variety}
                                                </option>
                                            )),
                                    )}
                        </GeralInput>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='date'
                                type='date'
                                defaultValue={rowData[seed.id]?.date}
                                readOnly={!rowEdit[seed.id]}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id].id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='area'
                                defaultValue={rowData[seed.id]?.area}
                                readOnly={!rowEdit[seed.id]}
                                maskVariant='price'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id].id)
                                }
                            />
                        </div>

                        {/* <div data-type='content'>{formatNumberToBR(rowData[seed.id]?.cost_per_kilogram)}</div> */}

                        {/* <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='cost_per_kilogram'
                                defaultValue={rowData[seed.id]?.cost_per_kilogram}
                                readOnly={rowEdit[seed.id] ? false : true}
                                maskVariant='price'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id].id)
                                }
                            />
                        </div> */}

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='kilogram_per_ha'
                                defaultValue={rowData[seed.id]?.kilogram_per_ha}
                                readOnly={!rowEdit[seed.id]}
                                maskVariant='price'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id].id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='spacing'
                                defaultValue={rowData[seed.id]?.spacing}
                                readOnly={!rowEdit[seed.id]}
                                maskVariant='price'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id].id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='seed_per_linear_meter'
                                defaultValue={rowData[seed.id]?.seed_per_linear_meter}
                                readOnly={!rowEdit[seed.id]}
                                maskVariant='price'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id].id)
                                }
                            />
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='pms'
                                defaultValue={rowData[seed.id]?.pms}
                                readOnly={!rowEdit[seed.id]}
                                maskVariant='price'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[seed.id].id)
                                }
                            />
                        </div>

                        <div data-type='content'>{formatNumberToBR(rowData[seed.id]?.seed_per_square_meter)}</div>

                        <div data-type='content'>
                            {formatNumberToBR(rowData[seed.id]?.quantity_per_ha).split(',')[0]}
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                {rowData[seed.id]?.systemLog && rowData[seed.id]?.systemLog?.admin && (
                                    <TableButton
                                        variant='user'
                                        onClick={() => {}}
                                        title={`Responsável: ${
                                            rowData[seed.id].systemLog?.admin
                                                ? rowData[seed.id].systemLog?.admin?.name
                                                : '--'
                                        }`}
                                    />
                                )}

                                {!rowEdit[seed.id] ? (
                                    <TableButton
                                        variant='edit'
                                        onClick={() => {
                                            setRowEdit((prevStates) => ({
                                                ...prevStates,
                                                [seed.id]: !prevStates[seed.id],
                                            }))
                                        }}
                                    />
                                ) : (
                                    <GeralButton variant='noStyle' type='button' onClick={() => confirmSubmit(seed.id)}>
                                        <IconifyIcon icon='lucide:check-circle-2' />
                                    </GeralButton>
                                )}

                                {!rowEdit[seed.id] ? (
                                    <TableButton
                                        variant='delete'
                                        onClick={() => {
                                            setDeleteId(seed.id)
                                            // setDeleteName(rowData[seed.id] ? 'Nome' : '');
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
                                                [seed.id]: !prevStates[seed.id],
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
                    <TableRow emptyString='Nenhuma semente encontrada' columnsCount={1} />
                ))}

            <GeralModal
                small
                isDelete
                deleteName={'essa semente?'}
                deleteFunction={deleteSeed}
                show={showDeleteCultureModal}
                setShow={setShowDeleteCultureModal}
                title='Excluir semente'
            />
        </>
    )
}

interface SeedsProps {
    propertyCropJoinId: number
    crop: Crop | undefined
    setCrop: any
}

const Seeds: FC<SeedsProps> = ({ propertyCropJoinId, crop, setCrop }) => {
    const [newRow, setNewRow] = useState(false)
    const [totalArea, setTotalArea] = useState(0)

    return (
        <>
            <div className={`${styles.managementDataHeader} ${styles.desktop}`}>
                <p>
                    Sementes / Área total: {formatNumberToBR(crop?.area ?? 0)} / Área disponível:{' '}
                    {totalArea > -1 ? formatNumberToBR((crop?.area ? parseFloat(crop?.area) : 0) - totalArea) : 0}
                </p>

                <GeralButton
                    smaller
                    smallIcon
                    value={`Adicionar semente`}
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
                gridColumns={`1fr 1.1fr 1.3fr 0.5fr 0.5fr 1fr 1fr 0.7fr 1.2fr 1fr 1fr`}>
                <Suspense fallback={<TableSkeleton />}>
                    <InputsRows
                        setCrop={setCrop}
                        newRow={newRow}
                        setNewRow={setNewRow}
                        propertyCropJoinId={propertyCropJoinId}
                        crop={crop}
                        totalArea={totalArea}
                        setTotalArea={setTotalArea}
                    />
                </Suspense>
            </GeralTable>
        </>
    )
}

export default Seeds
