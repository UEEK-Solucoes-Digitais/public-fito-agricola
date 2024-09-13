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
import { Crop, DataSeed } from '../../../types'

// Lazy Components
import GeralModal from '@/components/modal/GeralModal'

import GeralTable from '@/components/tables/GeralTable'
import { getMetricUnity } from '@/utils/getMetricUnity'
import validateDate from '@/utils/validateDate'
interface RowDataType {
    id: number
    date?: string
    total_production: number | string
    productivity: number
    property_management_data_seed_id: number
    systemLog?: any
    data_seed?: DataSeed
}

interface RowFinishHarvestType {
    id: number
    date?: string
}

interface InputsRowsProps {
    newRow: boolean
    setNewRow: (newRow: boolean) => void
    showFinishHarvestModal: boolean
    setShowFinishHarvestModal: (newRow: boolean) => void
    isFinishedHarvest: boolean
    setIsFinishedHarvest: (newRow: boolean) => void
    propertyCropJoinId: number
    crop: Crop | undefined
}

const tableHeaders = [
    'Data',
    'Produção total (kg)',
    'Cultivar',
    `Lavoura (${getMetricUnity()})`,
    'Produtividade (kg)',
    'Produtividade (sc)',
    'Ações',
]
const updateStatusRoute = '/api/properties/management-data/delete/harvest'

function InputsRows({
    newRow,
    setNewRow,
    propertyCropJoinId,
    crop,
    showFinishHarvestModal,
    setShowFinishHarvestModal,
    isFinishedHarvest,
    setIsFinishedHarvest,
}: InputsRowsProps) {
    const { setToast } = useNotification()

    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(
        `/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/harvest`,
        getFetch,
    )

    const [deleteId, setDeleteId] = useState(0)
    const [showDeleteCultureModal, setShowDeleteCultureModal] = useState(false)
    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RowDataType }>({})
    const [rowFinishHarvest, setRowFinishHarvest] = useState<RowFinishHarvestType>({
        id: 0,
        // data atual
        date: new Date().toISOString().split('T')[0],
    })

    const [finishedHarvestId, setFinishedHarvestId] = useState(0)
    const [dataSeeds, setDataSeed] = useState<DataSeed[]>([])

    const deleteSeed = async () => {
        try {
            setToast({ text: `${isFinishedHarvest ? 'Reativando' : 'Excluindo'} colheita`, state: 'loading' })

            await updateStatus(updateStatusRoute, admin.id, deleteId, 0).then(() => {
                setShowDeleteCultureModal(false)

                setToast({ text: `Colheita ${isFinishedHarvest ? 'reativada' : 'removida'}`, state: 'success' })
                mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/harvest`)
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
    }

    const isObjectValid = (data: RowDataType) => {
        for (const key of Object.keys(data) as Array<keyof RowDataType>) {
            // Pular a verificação para campos opcionais
            if (
                ['id', 'total_production', 'productivity', 'property_management_data_seed_id', 'data_seed'].includes(
                    key,
                )
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
            if (!validateDate(rowData[id].date!)) {
                setToast({
                    text: `Data inválida`,
                    state: 'danger',
                })
                return false
            }
            if (isObjectValid(rowData[id])) {
                setToast({
                    text: `${id == 0 ? 'Criando' : 'Atualizando'} colheita`,
                    state: 'loading',
                })

                axios
                    .post('/api/properties/management-data/form', {
                        ...rowData[id],
                        id,
                        admin_id: admin.id,
                        type: 'harvest',
                        properties_crops_id: propertyCropJoinId,
                        total_production:
                            typeof rowData[id].total_production == 'string'
                                ? rowData[id].total_production
                                : formatNumberToBR(rowData[id].total_production),
                    })
                    .then((response) => {
                        if (response.status == 200) {
                            setToast({
                                text: `Colheita ${id == 0 ? 'criada' : 'atualizada'}`,
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
                                        date: '',
                                        total_production: 0,
                                        productivity: 0,
                                        property_management_data_seed_id: 0,
                                    },
                                }))

                                setNewRow(false)
                            }

                            mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/harvest`)
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
    const submitFinishHarvest = () => {
        try {
            if (rowFinishHarvest.date == '') {
                setToast({ text: 'Preencha a data para continuar', state: 'info' })
                return
            }

            if (!validateDate(rowFinishHarvest.date!)) {
                setToast({
                    text: `Data inválida`,
                    state: 'danger',
                })
                return false
            }

            setToast({
                text: `Finalizando sem colheita`,
                state: 'loading',
            })

            axios
                .post('/api/properties/management-data/form', {
                    ...rowFinishHarvest,
                    productivity: 0,
                    admin_id: admin.id,
                    type: 'harvest',
                    properties_crops_id: propertyCropJoinId,
                    total_production: 0,
                    without_harvest: 1,
                })
                .then((response) => {
                    if (response.status == 200) {
                        setToast({
                            text: `Finalizado com sucesso`,
                            state: 'success',
                        })
                        setShowFinishHarvestModal(false)
                        mutate(`/api/properties/management-data/list/${propertyCropJoinId}/${admin.id}/harvest`)
                    }
                })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (data && data.management_data) {
            setIsFinishedHarvest(false)
            setFinishedHarvestId(0)
            const initialEditState: { [key: number]: boolean } = {}
            data.management_data.forEach((harvest: any) => {
                initialEditState[harvest.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RowDataType } = {}

            const generalInitData = {
                id: 0,
                date: '',
                total_production: 0,
                productivity: 0,
                property_management_data_seed_id: 0,
            }

            initialFormState[0] = generalInitData

            setDataSeed([])

            data.data_seeds.forEach((dataSeed: DataSeed) => {
                setDataSeed((prevStates) => [...prevStates, dataSeed])
            })

            data.management_data.forEach((harvest: any) => {
                if (harvest.without_harvest) {
                    setIsFinishedHarvest(true)
                    setFinishedHarvestId(harvest.id)
                }

                initialFormState[harvest.id] = {
                    id: harvest.id,
                    date: harvest.date,
                    total_production: formatNumberToBR(harvest.total_production),
                    productivity: harvest.productivity,
                    systemLog: harvest.system_log,
                    property_management_data_seed_id: harvest.property_management_data_seed_id,
                    data_seed: harvest.data_seed,
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
            {!isFinishedHarvest && (
                <GeralTable
                    headers={tableHeaders}
                    customClasses={[tableStyles.boxWidth]}
                    gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                    <Suspense fallback={<TableSkeleton />}>
                        {newRow && (
                            <TableRow gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                                <div data-type='content'>
                                    <GeralInput
                                        variant='inline'
                                        name='date'
                                        type='date'
                                        defaultValue={rowData[0]?.date}
                                        readOnly={false}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            handleUserInputChange(event, rowData[0].id)
                                        }
                                    />
                                </div>

                                <div data-type='content'>
                                    <GeralInput
                                        variant='inline'
                                        name='total_production'
                                        defaultValue={rowData[0]?.total_production}
                                        maskVariant='price'
                                        readOnly={false}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            handleUserInputChange(event, rowData[0].id)
                                        }
                                    />
                                </div>

                                <div data-type='content'>
                                    <GeralInput
                                        readOnly={false}
                                        defaultValue={rowData[0]?.property_management_data_seed_id}
                                        variant='inline'
                                        name='property_management_data_seed_id'
                                        type='select'
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            handleUserInputChange(event, 0)
                                        }
                                        required={false}>
                                        <option value={0} disabled>
                                            Selecione
                                        </option>

                                        {dataSeeds.map((dataSEED) => (
                                            <option key={dataSEED.id} value={dataSEED.id}>
                                                {dataSEED.product_variant}
                                            </option>
                                        ))}
                                    </GeralInput>
                                </div>

                                <div data-type='content'>{formatNumberToBR(crop ? crop?.area : '')}</div>

                                <div data-type='content'>
                                    {rowData[0]?.productivity > 0 ? formatNumberToBR(rowData[0]?.productivity) : '--'}
                                </div>

                                <div data-type='content'>
                                    {rowData[0]?.productivity > 0
                                        ? formatNumberToBR(rowData[0]?.productivity / 60)
                                        : '--'}
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
                            data.management_data.map((harvest: any) => (
                                <TableRow key={harvest.id} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                                    <div data-type='content'>
                                        <GeralInput
                                            variant='inline'
                                            name='date'
                                            type='date'
                                            defaultValue={rowData[harvest.id]?.date}
                                            readOnly={!rowEdit[harvest.id]}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                handleUserInputChange(event, rowData[harvest.id].id)
                                            }
                                        />
                                    </div>

                                    <div data-type='content'>
                                        <GeralInput
                                            variant='inline'
                                            name='total_production'
                                            defaultValue={rowData[harvest.id]?.total_production}
                                            maskVariant={rowEdit[harvest.id] ? 'price' : undefined}
                                            readOnly={!rowEdit[harvest.id]}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                handleUserInputChange(event, rowData[harvest.id].id)
                                            }
                                        />
                                    </div>

                                    <div data-type='content'>
                                        {rowEdit[harvest.id] ? (
                                            <GeralInput
                                                readOnly={false}
                                                defaultValue={rowData[harvest.id]?.property_management_data_seed_id}
                                                variant='inline'
                                                name='property_management_data_seed_id'
                                                type='select'
                                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                    handleUserInputChange(event, harvest.id)
                                                }
                                                required={false}>
                                                <option value={0} disabled>
                                                    Selecione
                                                </option>

                                                {dataSeeds.map((dataSeed) => (
                                                    <option key={dataSeed.id} value={dataSeed.id}>
                                                        {dataSeed.product_variant}
                                                    </option>
                                                ))}
                                            </GeralInput>
                                        ) : (
                                            <p>{rowData[harvest.id]?.data_seed?.product_variant ?? '--'}</p>
                                        )}
                                    </div>

                                    <div data-type='content'>
                                        {formatNumberToBR(
                                            rowData[harvest.id]?.data_seed
                                                ? (rowData[harvest.id]?.data_seed?.area ?? 0)
                                                : crop
                                                  ? crop?.area
                                                  : '',
                                        )}
                                    </div>

                                    <div data-type='content'>
                                        {formatNumberToBR(rowData[harvest.id]?.productivity).split(',')[0]}
                                    </div>
                                    <div data-type='content'>
                                        {formatNumberToBR(
                                            (rowData[harvest.id]?.productivity / 60).toFixed(1),
                                        ).substring(
                                            0,
                                            (rowData[harvest.id]?.productivity / 60).toFixed(1).toString().length,
                                        )}
                                    </div>

                                    <div data-type='action'>
                                        <TableActions>
                                            {rowData[harvest.id]?.systemLog &&
                                                rowData[harvest.id]?.systemLog?.admin && (
                                                    <TableButton
                                                        variant='user'
                                                        onClick={() => {}}
                                                        title={`Responsável: ${
                                                            rowData[harvest.id].systemLog?.admin
                                                                ? rowData[harvest.id].systemLog?.admin?.name
                                                                : '--'
                                                        }`}
                                                    />
                                                )}

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
                    </Suspense>
                </GeralTable>
            )}
            {isFinishedHarvest && (
                <>
                    <div className={styles.finishedHarvest}>
                        <h3>Essa lavoura foi encerrada sem colheita</h3>

                        <GeralButton
                            variant='secondary'
                            type='button'
                            small
                            value='Reativar colheita'
                            onClick={() => {
                                setDeleteId(finishedHarvestId)
                                setShowDeleteCultureModal(!showDeleteCultureModal)
                            }}
                        />
                    </div>
                </>
            )}

            {!data.management_data ||
                (data.management_data.length == 0 && (
                    <TableRow emptyString='Nenhum colheita encontrado' columnsCount={1} />
                ))}

            <GeralModal
                small
                isDelete
                deleteName='a colheita'
                deleteFunction={deleteSeed}
                show={showDeleteCultureModal}
                setShow={setShowDeleteCultureModal}
                deleteButtonText={isFinishedHarvest ? 'Reativar colheita' : 'Excluir colheita'}
                title={isFinishedHarvest ? 'Reativar colheita' : 'Excluir colheita'}
                deleteText={
                    isFinishedHarvest
                        ? 'Deseja reativar a lavoura?'
                        : `Esta é uma ação irreversível. Você está certo de que deseja excluir a colheita?`
                }
            />
            <GeralModal
                small
                show={showFinishHarvestModal}
                setShow={setShowFinishHarvestModal}
                title='Encerrar sem colheita'>
                <div style={{ marginTop: '20px' }}></div>

                <GeralInput
                    // variant='inline'
                    name='date'
                    label={'Data'}
                    type='date'
                    defaultValue={rowFinishHarvest.date}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setRowFinishHarvest({ ...rowFinishHarvest, date: event.target.value })
                    }
                />

                <div style={{ marginTop: '20px', display: 'flex', gap: '50px' }}>
                    <GeralButton
                        variant='secondary'
                        type='button'
                        small
                        value='Confirmar'
                        onClick={submitFinishHarvest}
                    />

                    <GeralButton
                        variant='quaternary'
                        type='button'
                        small
                        value='Cancelar'
                        onClick={() => setShowFinishHarvestModal(false)}
                    />
                </div>
            </GeralModal>
        </>
    )
}

interface HarvestProps {
    propertyCropJoinId: number
    crop: Crop | undefined
}

const Harvest: FC<HarvestProps> = ({ crop, propertyCropJoinId }) => {
    const [newRow, setNewRow] = useState(false)
    const [showFinishHarvestModal, setShowFinishHarvestModal] = useState(false)
    const [isFinishedHarvest, setIsFinishedHarvest] = useState(false)

    return (
        <>
            {!isFinishedHarvest && (
                <div className={`${styles.managementDataHeader} ${styles.desktop}`}>
                    <p>Todas as colheitas</p>

                    <div className={styles.buttonActions}>
                        <GeralButton
                            smaller
                            smallIcon
                            value={`Encerrar sem colheita`}
                            variant='primary'
                            onClick={() => {
                                setShowFinishHarvestModal(true)
                            }}>
                            <IconifyIcon icon='ph:plant' />
                        </GeralButton>
                        <GeralButton
                            smaller
                            smallIcon
                            value={`Adicionar colheita`}
                            variant='secondary'
                            onClick={() => {
                                setNewRow(!newRow)
                            }}>
                            <IconifyIcon icon='ph:plus' />
                        </GeralButton>
                    </div>
                </div>
            )}

            <Suspense fallback={<TableSkeleton />}>
                <InputsRows
                    newRow={newRow}
                    setNewRow={setNewRow}
                    propertyCropJoinId={propertyCropJoinId}
                    showFinishHarvestModal={showFinishHarvestModal}
                    setShowFinishHarvestModal={setShowFinishHarvestModal}
                    isFinishedHarvest={isFinishedHarvest}
                    setIsFinishedHarvest={setIsFinishedHarvest}
                    crop={crop}
                />
            </Suspense>
        </>
    )
}

export default Harvest
