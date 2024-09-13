'use client'

import { ChangeEvent, useEffect, useState } from 'react'

import { RainGauge } from '@/@types/RainGauge'
import Loading from '@/app/dashboard/loading'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import { getActualDate } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import axios from 'axios'
import useSWR, { mutate } from 'swr'

import GeralModal from '@/components/modal/GeralModal'
import WriteLog from '@/utils/logger'
import deleteItem from '@/utils/updateStatus'
import styles from './register.module.scss'
import { IProps } from './types'

const tableHeaders = ['Volume', 'Data', 'Ações']

export default function Register({ cropId, selectedCrops, active, updateStatus, reset }: IProps) {
    const { admin } = useAdmin()
    const { setToast } = useNotification()

    const [loading, setLoading] = useState(false)
    const [newRow, setNewRow] = useState(false)
    const [showDeleteRainGaugeModal, setShowDeleteRainGaugeModal] = useState(false)
    const [deleteId, setDeleteId] = useState(0)

    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RainGauge }>({})
    const [rowDataAdd, setRowDataAdd] = useState<any>({
        volumes: [0],
        dates: [getActualDate()],
    })

    const { data, isLoading, error } = useSWR(`/api/properties/read-crop-havest-details/${cropId}`, getFetch)

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (data) {
            // Configuração inicial para rain gauges
            // setDatasetRainGauge(Object.values(data.rain_gauges));
            // setLabelsRainGauge(Object.keys(data.rain_gauges));
            // setDatasetRainGaugeTotalVolume(Object.values(data.rain_gauges_total_volume));

            // // Configuração inicial para doenças
            // const labelsDisease: string[] = Object.keys(data.diseases);
            // setLabelsDisease(labelsDisease);

            // const diseasesNames: string[] = [];
            // const datasetDiseases: any = [];

            // Object.keys(data.diseases).map((disease: any) => {
            //     datasetDiseases[disease] = [];

            //     Object.keys(data.diseases[disease]).map((diseaseName: any) => {
            //         datasetDiseases[disease][diseaseName] = data.diseases[disease][diseaseName];
            //         if (diseasesNames.indexOf(diseaseName) == -1) {
            //             diseasesNames.push(diseaseName);
            //         }
            //     });
            // });

            // setDatasetDiseases(datasetDiseases);
            // setNamesDisease(diseasesNames);

            const initialEditState: { [key: number]: boolean } = {}
            data.rain_gauges_register.forEach((rain_gauge: any) => {
                initialEditState[rain_gauge.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RainGauge } = {}

            initialFormState[0] = {
                id: 0,
                date: getActualDate(),
                volume: 0,
            }

            data.rain_gauges_register.forEach((rain_gauge: RainGauge) => {
                initialFormState[rain_gauge.id] = {
                    id: rain_gauge.id,
                    date: rain_gauge.date,
                    volume: rain_gauge.volume,
                }
            })

            setRowData(initialFormState)
        }
    }, [data, isLoading])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: 'Falha ao obter dados', state: 'danger' })
            }
        }
    }, [error])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        updateStatus(0)
        setLoading(false)
    }, [admin.id, reset])

    const handleAddInput = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        const { name, value } = e.target
        const values = rowDataAdd[name as keyof any]

        values[index] = value

        setRowDataAdd((prevData: any) => ({ ...prevData, [name]: values }))
    }

    const handleUserInputChange = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: any) => {
        const { name, value } = e.target

        setRowData((prevStates) => ({
            ...prevStates,
            [id]: { ...prevStates[id], [name]: value },
        }))
    }

    function addRowDataAdd() {
        setRowDataAdd((prevData: any) => ({
            ...prevData,
            volumes: [...prevData.volumes, 0],
            dates: [...prevData.dates, getActualDate()],
        }))
    }

    function removeItem(index: number) {
        return () => {
            const volumes = rowDataAdd.volumes
            const dates = rowDataAdd.dates

            volumes.splice(index, 1)
            dates.splice(index, 1)

            setRowDataAdd((prevData: any) => ({
                ...prevData,
                volumes,
                dates,
            }))
        }
    }

    const isObjectValid = (data: RainGauge) => {
        for (const key of Object.keys(data) as Array<keyof RainGauge>) {
            if (['id'].includes(key)) continue

            if (data[key] == undefined || data[key] == null) {
                return false
            }

            if (data[key] == '') {
                return false
            }
        }
        return true
    }

    function isDataAddValid() {
        for (const key of Object.keys(rowDataAdd) as Array<keyof RainGauge>) {
            if (['volumes', 'dates'].includes(key)) continue

            if (rowDataAdd[key] == undefined || rowDataAdd[key] == null) {
                return false
            }

            if (rowDataAdd[key] == '') {
                return false
            }
        }

        return true
    }

    const confirmSubmit = (id: number) => {
        try {
            if (!loading) {
                if (id == 0 ? isDataAddValid() : isObjectValid(rowData[id])) {
                    updateStatus(2)
                    setLoading(true)

                    setToast({
                        text: `${id == 0 ? 'Criando' : 'Atualizando'} registro`,
                        state: 'loading',
                    })

                    const body = id == 0 ? rowDataAdd : rowData[id]

                    axios
                        .post('/api/properties/rain-gauge/form', {
                            ...body,
                            id,
                            admin_id: admin.id,
                            crops: selectedCrops.join(','),
                            property_crop_join_id: cropId,
                        })
                        .then((response) => {
                            if (Number(response.status) == 200) {
                                setRowEdit((prevStates) => ({
                                    ...prevStates,
                                    [id]: !prevStates[id],
                                }))

                                if (id == 0) {
                                    setRowDataAdd({
                                        volumes: [0],
                                        dates: [getActualDate()],
                                    })

                                    setNewRow(false)
                                }

                                setToast({
                                    text: `Registro ${id == 0 ? 'criado' : 'atualizado'}`,
                                    state: 'success',
                                })

                                updateStatus(4)

                                mutate(`/api/properties/read-crop-havest-details/${cropId}`)
                            }
                        })
                } else {
                    setToast({ text: 'Preencha todos os campos para continuar', state: 'warning' })
                }
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        } finally {
            setLoading(false)
        }
    }

    async function deleteRainGauge() {
        try {
            setToast({ text: 'Excluindo registro', state: 'loading' })
            await deleteItem('/api/properties/rain-gauge/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteRainGaugeModal(false)

                setToast({ text: 'Registro excluído', state: 'success' })
                mutate(`/api/properties/read-crop-havest-details/${cropId}`)
            })
        } catch (error) {
            console.error(error)
            setToast({ text: 'Não foi possível completar a operação no momento', state: 'danger' })
        }
    }

    // * When disabled
    if (!active) {
        return <></>
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.addRegister}>
                <GeralButton
                    smaller
                    smallIcon
                    value='Adicionar registro'
                    variant='secondary'
                    onClick={() => setNewRow((state) => !state)}>
                    <IconifyIcon icon='ph:plus' />
                </GeralButton>
            </div>

            <GeralTable
                headers={tableHeaders}
                gridColumns={`repeat(${tableHeaders.length}, 1fr)`}
                customClasses={[tableStyles.rainGaugeTable]}>
                {newRow && (
                    <>
                        {rowDataAdd.volumes.map((_volume: number, index: number) => (
                            <TableRow
                                key={`add-register-${index + 1}`}
                                gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                                <div data-type='content'>
                                    <GeralInput
                                        variant='inline'
                                        name='volumes'
                                        defaultValue={rowDataAdd?.volumes[index]}
                                        readOnly={false}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            handleAddInput(event, index)
                                        }
                                    />
                                </div>

                                <div data-type='content'>
                                    <GeralInput
                                        variant='inline'
                                        name='dates'
                                        type='date'
                                        max={getActualDate()}
                                        defaultValue={rowDataAdd?.dates[index]}
                                        readOnly={false}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            handleAddInput(event, index)
                                        }
                                    />
                                </div>

                                <div data-type='action'>
                                    <TableActions>
                                        {index == 0 ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <GeralButton variant='noStyle' type='button' onClick={removeItem(index)}>
                                                <IconifyIcon icon='ph:trash' />
                                            </GeralButton>
                                        )}
                                    </TableActions>
                                </div>

                                {index == rowDataAdd.volumes.length - 1 && (
                                    <div style={{ gridColumn: 'span 3' }}>
                                        <GeralButton
                                            variant='inlineGreen'
                                            value='+Nova linha'
                                            onClick={addRowDataAdd}
                                        />
                                    </div>
                                )}
                            </TableRow>
                        ))}
                    </>
                )}
                {data?.rain_gauges_register?.map((rainGauge: RainGauge) => (
                    <TableRow key={`rain-${rainGauge.id}`} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                        <div data-type='content' className={styles.contentFlex}>
                            <GeralInput
                                variant='inline'
                                name='volume'
                                defaultValue={rowData[rainGauge.id]?.volume}
                                readOnly={!rowEdit[rainGauge.id]}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[rainGauge.id].id)
                                }
                            />
                            mm
                        </div>

                        <div data-type='content'>
                            <GeralInput
                                variant='inline'
                                name='date'
                                type='date'
                                max={getActualDate()}
                                defaultValue={rowData[rainGauge.id]?.date}
                                readOnly={!rowEdit[rainGauge.id]}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleUserInputChange(event, rowData[rainGauge.id].id)
                                }
                            />
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                {!rowEdit[rainGauge.id] ? (
                                    <TableButton
                                        variant='edit'
                                        onClick={() => {
                                            setRowEdit((prevStates) => ({
                                                ...prevStates,
                                                [rainGauge.id]: !prevStates[rainGauge.id],
                                            }))
                                        }}
                                    />
                                ) : (
                                    <GeralButton
                                        variant='secondary'
                                        value='Salvar'
                                        type='button'
                                        smaller
                                        onClick={() => confirmSubmit(rainGauge.id)}
                                    />
                                )}

                                {!rowEdit[rainGauge.id] ? (
                                    <TableButton
                                        variant='delete'
                                        onClick={() => {
                                            setDeleteId(rainGauge.id)
                                            setShowDeleteRainGaugeModal(!showDeleteRainGaugeModal)
                                        }}
                                    />
                                ) : (
                                    <GeralButton
                                        variant='noStyle'
                                        type='button'
                                        onClick={() => {
                                            setRowEdit((prevStates) => ({
                                                ...prevStates,
                                                [rainGauge.id]: !prevStates[rainGauge.id],
                                            }))
                                        }}>
                                        <IconifyIcon icon='ph:x' />
                                    </GeralButton>
                                )}
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

                {!data ||
                    !data.rain_gauges ||
                    (data.rain_gauges.length == 0 && (
                        <TableRow emptyString='Nenhum registro encontrado' columnsCount={1} />
                    ))}
            </GeralTable>

            <GeralModal
                small
                isDelete
                deleteName='o registro dessa data?'
                deleteFunction={deleteRainGauge}
                show={showDeleteRainGaugeModal}
                setShow={setShowDeleteRainGaugeModal}
                title='Excluir registro'
            />
        </div>
    )
}
