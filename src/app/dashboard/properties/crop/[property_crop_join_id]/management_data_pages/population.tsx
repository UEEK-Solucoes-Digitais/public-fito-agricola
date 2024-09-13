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
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { ChangeEvent, FC, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../../../styles.module.scss'
import { DataSeed } from '../../../types'

// Lazy Components
import GeralModal from '@/components/modal/GeralModal'

import GeralTable from '@/components/tables/GeralTable'
import { getFullUnity, getMetricUnity } from '@/utils/getMetricUnity'
import validateDate from '@/utils/validateDate'
interface RowDataType {
    id: number
    property_management_data_seed_id: number
    seed_per_linear_meter: number
    seed_per_square_meter: number
    quantity_per_ha: number
    emergency_percentage: number
    emergency_percentage_date: string
    plants_per_hectare: number
    systemLog?: any
}

interface InputsRowsProps {
    newRow: boolean
    setNewRow: (newRow: boolean) => void
    propertyCropJoinId: number
}

const tableHeaders = [
    'Cultivar',
    'Plantas por metro linear',
    'Plantas por m2',
    `Plantas por ${getFullUnity()}`,
    'Percentual de emergência',
    'Data de emergência',
    `Qtd/${getMetricUnity()}`,
    'Ações',
]

const updateStatusRoute = '/api/properties/management-data/delete/population'

function InputsRows({ newRow, setNewRow, propertyCropJoinId }: InputsRowsProps) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(
        `/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/population`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteCultureModal, setShowDeleteCultureModal] = useState(false)
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})

    const [dataSeeds, setDataSeed] = useState<DataSeed[]>([])

    const deleteSeed = async () => {
        try {
            setToast({ text: `Excluindo população`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteCultureModal(false)

                setToast({ text: `População excluída`, state: 'success' })
                mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/population`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const setRowDataFields = (id: number, dataSeed: DataSeed, name: string, value: any) => {
        let linearMeter = 0
        let plantsPerSquareMeter = 0

        if (name == 'property_management_data_seed_id') {
            linearMeter =
                parseFloat(rowData[id].seed_per_linear_meter.toString()) > 0 &&
                parseFloat(rowData[id].seed_per_linear_meter.toString()) != null
                    ? parseFloat(rowData[id].seed_per_linear_meter.toString())
                    : 0
            plantsPerSquareMeter = dataSeed.spacing > 0 ? linearMeter / dataSeed.spacing : 0
        } else {
            const newValue = value.replace(',', '.')
            linearMeter = parseFloat(newValue) > 0 && parseFloat(newValue) != null ? parseFloat(newValue) : 0
            plantsPerSquareMeter = dataSeed.spacing > 0 ? linearMeter / dataSeed.spacing : 0
        }

        setRowData((prevStates) => ({
            ...prevStates,
            [id]: {
                ...prevStates[id],
                seed_per_square_meter: plantsPerSquareMeter,
                quantity_per_ha: plantsPerSquareMeter * 10000,
                emergency_percentage:
                    dataSeed.seed_per_linear_meter > 0 ? (linearMeter * 100) / dataSeed.seed_per_linear_meter : 0,
                plants_per_hectare: plantsPerSquareMeter * 10000,
            },
        }))
    }

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: any) => {
        const { name, value } = e.target

        setRowData((prevStates) => ({
            ...prevStates,
            [id]: { ...prevStates[id], [name]: value },
        }))

        if (name == 'property_management_data_seed_id' || name == 'seed_per_linear_meter') {
            const dataSeed = dataSeeds.find(
                (dataSeed) =>
                    dataSeed.id ==
                    (name == 'property_management_data_seed_id'
                        ? value
                        : rowData[id]?.property_management_data_seed_id),
            )

            if (dataSeed) {
                setRowDataFields(id, dataSeed, name, value)
            }
        }
    }

    const isObjectValid = (data: RowDataType) => {
        for (const key of Object.keys(data) as Array<keyof RowDataType>) {
            // Pular a verificação para campos opcionais
            if (
                [
                    'seed_per_square_meter',
                    'quantity_per_ha',
                    'emergency_percentage',
                    'plants_per_hectare',
                    'id',
                ].includes(key)
            )
                continue

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

    const confirmSubmit = (id: number) => {
        try {
            if (!validateDate(rowData[id].emergency_percentage_date!)) {
                setToast({
                    text: `Data inválida`,
                    state: 'danger',
                })
                return false
            }

            if (isObjectValid(rowData[id])) {
                setToast({
                    text: `${id == 0 ? 'Criando' : 'Atualizando'} população`,
                    state: 'loading',
                })

                axios
                    .post('/api/properties/management-data/form', {
                        ...rowData[id],
                        id,
                        admin_id: admin.id,
                        type: 'population',
                        properties_crops_id: propertyCropJoinId,
                    })
                    .then((response) => {
                        if (response.status == 200) {
                            setToast({
                                text: `População ${id == 0 ? 'criada' : 'atualizada'}`,
                                state: 'success',
                            })

                            setRowEdit((prevStates) => ({
                                ...prevStates,
                                [id]: !prevStates[id],
                            }))

                            if (id == 0) {
                                setRowData((prevStates) => ({
                                    ...prevStates,
                                    0: {
                                        id: 0,
                                        seed_per_linear_meter: 0,
                                        seed_per_square_meter: 0,
                                        quantity_per_ha: 0,
                                        emergency_percentage: 0,
                                        emergency_percentage_date: '',
                                        plants_per_hectare: 0,
                                        property_management_data_seed_id: 0,
                                    },
                                }))

                                setNewRow(false)
                            }

                            mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/population`)
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
            data.management_data.forEach((population: any) => {
                initialEditState[population.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            initialFormState[0] = {
                id: 0,
                seed_per_linear_meter: 0,
                seed_per_square_meter: 0,
                quantity_per_ha: 0,
                emergency_percentage: 0,
                emergency_percentage_date: '',
                plants_per_hectare: 0,
                property_management_data_seed_id: 0,
            }

            setDataSeed([])

            data.data_seeds.forEach((dataSeed: DataSeed) => {
                setDataSeed((prevStates) => [...prevStates, dataSeed])
            })

            data.management_data.forEach((population: any) => {
                initialFormState[population.id] = {
                    id: population.id,
                    seed_per_linear_meter: population.seed_per_linear_meter,
                    seed_per_square_meter: population.seed_per_square_meter,
                    quantity_per_ha: population.quantity_per_ha,
                    emergency_percentage: population.emergency_percentage,
                    emergency_percentage_date: population.emergency_percentage_date,
                    plants_per_hectare: population.plants_per_hectare,
                    property_management_data_seed_id: population.property_management_data_seed_id,
                    systemLog: population.system_log,
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
                <TableRow gridColumns={`1fr 1.3fr 1fr 1fr 1.5fr 1.2fr 0.7fr 1fr`}>
                    <div data-type='content'>
                        <GeralInput
                            readOnly={false}
                            defaultValue={rowData[0]?.property_management_data_seed_id}
                            variant='inline'
                            name='property_management_data_seed_id'
                            type='select'
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                            required>
                            <option value={0} disabled>
                                Selecione
                            </option>

                            {dataSeeds.map((dataSeed) => (
                                <option key={dataSeed.id} value={dataSeed.id}>
                                    {dataSeed.product_variant}
                                </option>
                            ))}
                        </GeralInput>
                    </div>

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='seed_per_linear_meter'
                            defaultValue={rowData[0]?.seed_per_linear_meter}
                            maskVariant='price'
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>{formatNumberToBR(rowData[0].seed_per_square_meter)}</div>
                    <div data-type='content'>{formatNumberToBR(rowData[0].plants_per_hectare)}</div>
                    <div data-type='content'>{formatNumberToBR(rowData[0].emergency_percentage)}</div>

                    <div data-type='content'>
                        <GeralInput
                            variant='inline'
                            name='emergency_percentage_date'
                            type='date'
                            defaultValue={rowData[0]?.emergency_percentage_date}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => handleUserInputChange(event, 0)}
                        />
                    </div>

                    <div data-type='content'>{formatNumberToBR(rowData[0].quantity_per_ha).split(',')[0]}</div>

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
            )}

            {data.management_data &&
                data.management_data.map((population: any) => (
                    <TableRow key={population.id} gridColumns={`1fr 1.3fr 1fr 1fr 1.5fr 1.2fr 0.7fr 1fr`}>
                        <div data-type='content'>
                            <GeralInput
                                readOnly={!rowEdit[population.id]}
                                defaultValue={rowData[population.id]?.property_management_data_seed_id}
                                variant='inline'
                                name='property_management_data_seed_id'
                                type='select'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[population.id]?.id)
                                }
                                required>
                                <option value={0} disabled>
                                    Selecione
                                </option>

                                {dataSeeds.map((dataSeed) => (
                                    <option
                                        key={dataSeed.id}
                                        value={dataSeed.id}
                                        selected={
                                            rowData[population.id]?.property_management_data_seed_id == dataSeed.id
                                        }>
                                        {dataSeed.product_variant}
                                    </option>
                                ))}
                            </GeralInput>
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='seed_per_linear_meter'
                                defaultValue={rowData[population.id]?.seed_per_linear_meter}
                                maskVariant='price'
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[population.id]?.id)
                                }
                                readOnly={!rowEdit[population.id]}
                            />
                        </div>

                        <div data-type='content'>{formatNumberToBR(rowData[population.id]?.seed_per_square_meter)}</div>
                        <div data-type='content'>
                            {formatNumberToBR(rowData[population.id]?.plants_per_hectare).split(',')[0]}
                        </div>
                        <div data-type='content'>{formatNumberToBR(rowData[population.id]?.emergency_percentage)}</div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='emergency_percentage_date'
                                type='date'
                                defaultValue={rowData[population.id]?.emergency_percentage_date}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[population.id]?.id)
                                }
                                readOnly={!rowEdit[population.id]}
                            />
                        </div>

                        <div data-type='content'>
                            {formatNumberToBR(rowData[population.id]?.quantity_per_ha).split(',')[0]}
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                {rowData[population.id]?.systemLog && rowData[population.id]?.systemLog?.admin && (
                                    <TableButton
                                        variant='user'
                                        onClick={() => {}}
                                        title={`Responsável: ${
                                            rowData[population.id].systemLog?.admin
                                                ? rowData[population.id].systemLog?.admin?.name
                                                : '--'
                                        }`}
                                    />
                                )}

                                {!rowEdit[population.id] ? (
                                    <TableButton
                                        variant='edit'
                                        onClick={() => {
                                            setRowEdit((prevStates) => ({
                                                ...prevStates,
                                                [population.id]: !prevStates[population.id],
                                            }))
                                        }}
                                    />
                                ) : (
                                    <GeralButton
                                        variant='secondary'
                                        value='Salvar'
                                        type='button'
                                        smaller
                                        onClick={() => confirmSubmit(population.id)}
                                    />
                                )}

                                {!rowEdit[population.id] ? (
                                    <TableButton
                                        variant='delete'
                                        onClick={() => {
                                            setDeleteId(population.id)
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
                                                [population.id]: !prevStates[population.id],
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
                    <TableRow emptyString='Nenhuma população encontrada' columnsCount={1} />
                ))}

            <GeralModal
                small
                isDelete
                deleteName='a população'
                deleteFunction={deleteSeed}
                show={showDeleteCultureModal}
                setShow={setShowDeleteCultureModal}
                title='Excluir população'
            />
        </>
    )
}

interface PopulationProps {
    propertyCropJoinId: number
}

const Population: FC<PopulationProps> = ({ propertyCropJoinId }) => {
    const [newRow, setNewRow] = useState(false)

    return (
        <>
            <div className={`${styles.managementDataHeader} ${styles.desktop}`}>
                <p>População</p>

                <GeralButton
                    smaller
                    smallIcon
                    value={`Adicionar população`}
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
                    value={`População`}
                    variant='secondary'
                    onClick={() => {
                        setNewRow(!newRow)
                    }}>
                    <IconifyIcon icon='ph:plus' />
                </GeralButton>
            </div>
            <GeralTable
                customClasses={[tableStyles.boxWidth]}
                headers={tableHeaders}
                gridColumns={`1fr 1.3fr 1fr 1fr 1.5fr 1.2fr 0.7fr 1fr`}>
                <Suspense fallback={<TableSkeleton />}>
                    <InputsRows newRow={newRow} setNewRow={setNewRow} propertyCropJoinId={propertyCropJoinId} />
                </Suspense>
            </GeralTable>
        </>
    )
}

export default Population
