'use client'

import Admin from '@/@types/Admin'
import PropertyCropDisease from '@/@types/PropertyCropDisease'
import PropertyCropObservation from '@/@types/PropertyCropObservation'
import PropertyCropPest from '@/@types/PropertyCropPest'
import PropertyCropStageProps from '@/@types/PropertyCropStage'
import PropertyCropWeed from '@/@types/PropertyCropWeed'
import Loading from '@/app/loading'
import GeralButton from '@/components/buttons/GeralButton'
import LevelTarget from '@/components/elements/LevelTarget'
import Fancybox from '@/components/fancybox/Fancybox'
import DiseaseForm from '@/components/forms/monitoring/Disease'
import ObservationForm from '@/components/forms/monitoring/Observation'
import PestForm from '@/components/forms/monitoring/Pest'
import Register from '@/components/forms/monitoring/Register'
import StadiumForm from '@/components/forms/monitoring/Stadium'
import WeedForm from '@/components/forms/monitoring/Weed'
import stylesReports from '@/components/forms/reports/styles.module.scss'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TableRow from '@/components/tables/TableRow'
import GeralTab from '@/components/tabs/GeralTab'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import { formatDateToDDMMYY, formatDateToYYMMDD, formatNumberToBR, getActualDate, getStageName } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { ChangeEvent, FC, Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { LatLng } from 'use-places-autocomplete'
import styles from '../../styles.module.scss'
import { CropJoin } from '../../types'

const MapCrop = dynamic(() => import('./map_crop'), {
    ssr: false,
    loading: () => <Loading />,
})

const tableHeaders = ['Data', 'Estádio', 'Doença', 'Praga', 'Daninha', 'Obs.', 'Ações']
const tableIcons = ['', 'ph:plant', 'fluent:briefcase-medical-32-regular', 'bx:bug', 'ci:leaf', 'ph:info', '', '']

interface MonitoringProps {
    crop: number
    crops: any[]
}

interface ManagementDataProps {
    [key: string]: any
    diseases: PropertyCropDisease[]
    observations: PropertyCropObservation[]
    pests: PropertyCropPest[]
    stages: PropertyCropStageProps[]
    weeds: PropertyCropWeed[]
    admin: Admin
}

type FormStateProps = 0 | 1 | 2 | 3 | 4 // * 0 - Normal | 1 - Pendente | 2 - Processando | 3 - Erro | 4 - Sucesso

const GetRows = ({ crop, crops }: MonitoringProps) => {
    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(`/api/properties/monitoring/list/${crop}`, getFetch)
    const { data: seedData, isLoading: seedLoading } = useSWR(
        `/api/interference-factors/list-by-join/${crop}`,
        getFetch,
    )

    const [selectedDate, setSelectedDate] = useState('')
    const [formatedDate, setFormatedDate] = useState('')
    const [deleteDate, setDeleteDate] = useState('')
    const [showDeleteCultureModal, setShowDeleteCultureModal] = useState(false)
    const { setToast } = useNotification()

    // Modal
    const [showFormModal, setShowFormModal] = useState(false)
    const [showDateModal, setShowDateModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [selectedTab, setSelectedTab] = useState<string | null>('estadio')
    const [selectedMonitorDate, setSelectedMonitorDate] = useState('')
    const [dataMonitoring, setDataMonitoring] = useState<ManagementDataProps>()
    const [showChangeDateModal, setShowChangeDateModal] = useState(false)
    const [newDate, setNewDate] = useState('')

    const [diseasesList, setDiseasesList] = useState<any>([])
    const [pestsList, setPestsList] = useState<any>([])

    const stadiumFormRef = useRef<HTMLFormElement>(null)
    const diseaseFormRef = useRef<HTMLFormElement>(null)
    const pestFormRef = useRef<HTMLFormElement>(null)
    const weedFormRef = useRef<HTMLFormElement>(null)
    const observationFormRef = useRef<HTMLFormElement>(null)
    const [formState, setFormState] = useState<FormStateProps[]>([0, 0, 0, 0, 0])
    const [path, setPath] = useState<LatLng[]>([])

    const [changeStage, setChangeStage] = useState(false)
    const [changeDisease, setChangeDisease] = useState(false)
    const [changePest, setChangePest] = useState(false)
    const [changeWeed, setChangeWeed] = useState(false)
    const [changeObservation, setChangeObservation] = useState(false)

    const [managementDataMapDate, setManagementDataMapDate] = useState('')
    const [showMapModal, setShowMapModal] = useState(false)

    const [textObservation, setTextObservation] = useState('')
    const [showObservationModal, setShowObservationModal] = useState(false)
    const [imagesObservation, setImageObservation] = useState<any[] | undefined>([])
    const [imagePath, setImagePath] = useState('')

    const [showExportModal, setExportModal] = useState(false)

    const [selectedCrops, setSelectedCrops] = useState<any[]>([crop.toString()])

    const handleChangeSelectedCrops = (e: ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value != '0' && !selectedCrops.includes(e.target.value)) {
            setSelectedCrops([...selectedCrops, e.target.value])
        }
    }

    const removeCrop = (id: string) => {
        setSelectedCrops(selectedCrops.filter((crop) => crop != id))
    }

    const canSubmit = useCallback(() => {
        let state = false

        formState.forEach((item: FormStateProps) => {
            if (item == 1 || item == 3) {
                state = true
            }
        })

        return state
    }, [formState])

    const getIcon = useCallback(
        (index: number) => {
            const status = formState[index]

            if (status == 4) {
                return 'mdi:success'
            } else if (status == 3) {
                return 'material-symbols:error-outline'
            } else if (status == 2) {
                return 'line-md:loading-loop'
            } else if (status == 1) {
                return 'mdi:dot'
            }

            return ''
        },
        [formState],
    )

    const modalHeader = useMemo(
        () => [
            {
                id: 'estadio',
                name: 'Estádio',
                icon: getIcon(0),
                disabled: loading || formState[0] == 2,
            },
            {
                id: 'doenca',
                name: 'Doença',
                icon: getIcon(1),
                disabled: loading || formState[1] == 2,
            },
            {
                id: 'praga',
                name: 'Praga',
                icon: getIcon(2),
                disabled: loading || formState[2] == 2,
            },
            {
                id: 'daninha',
                name: 'Daninha',
                icon: getIcon(3),
                disabled: loading || formState[3] == 2,
            },
            {
                id: 'observacao',
                name: 'Observação',
                icon: getIcon(4),
                disabled: loading || formState[4] == 2,
            },
            {
                id: 'registros',
                name: 'Pluviômetros',
                icon: getIcon(5),
                disabled: loading || formState[5] == 2,
            },
        ],
        [formState, loading, getIcon],
    )

    const submitAllForms = useCallback(async () => {
        try {
            if (!loading && canSubmit()) {
                setLoading(true)
                let success = false

                if (isEdit && selectedDate) {
                    setToast({
                        text: `Processando...`,
                        state: 'loading',
                    })

                    setSelectedMonitorDate(formatDateToYYMMDD(selectedDate, '-'))
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                } else if (!selectedMonitorDate || selectedMonitorDate == '') {
                    const date = new Date()
                    date.setTime(date.getTime() - 3)

                    setSelectedMonitorDate(getActualDate())
                    setShowDateModal(true)
                    return
                }

                if (stadiumFormRef.current && (formState[0] == 1 || formState[0] == 3)) {
                    setSelectedTab(modalHeader[0].id)
                    await stadiumFormRef.current.formStadium()

                    const state = formState[0] as number
                    if (state == 3) {
                        success = false
                        return
                    } else if (state == 4) {
                        success = true
                    }
                }

                if (diseaseFormRef.current && (formState[1] == 1 || formState[1] == 3)) {
                    setSelectedTab(modalHeader[1].id)
                    await diseaseFormRef.current.formDisease()

                    const state = formState[1] as number
                    if (state == 3) {
                        success = false
                        return
                    } else if (state == 4) {
                        success = true
                    }
                }

                if (pestFormRef.current && (formState[2] == 1 || formState[2] == 3)) {
                    setSelectedTab(modalHeader[2].id)
                    await pestFormRef.current.formPest()

                    const state = formState[2] as number
                    if (state == 3) {
                        success = false
                        return
                    } else if (state == 4) {
                        success = true
                    }
                }

                if (weedFormRef.current && (formState[3] == 1 || formState[3] == 3)) {
                    setSelectedTab(modalHeader[3].id)
                    await weedFormRef.current.formWeed()

                    const state = formState[3] as number
                    if (state == 3) {
                        success = false
                        return
                    } else if (state == 4) {
                        success = true
                    }
                }

                if (observationFormRef.current && (formState[4] == 1 || formState[4] == 3)) {
                    setSelectedTab(modalHeader[4].id)
                    await observationFormRef.current.formObservation()

                    const state = formState[4] as number
                    if (state == 3) {
                        success = false
                        return
                    } else if (state == 4) {
                        success = true
                    }
                }

                setShowFormModal(false)

                if (success) {
                    setToast({
                        text: `Monitoramento e módulos ${isEdit ? 'salvos' : 'adicionados'} com sucesso`,
                        state: 'success',
                    })
                }

                mutate(`/api/properties/monitoring/list/${crop}`)
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        } finally {
            setLoading(false)
            // setSelectedMonitorDate('');
        }
    }, [canSubmit, crop, formState, isEdit, loading, modalHeader, selectedDate, selectedMonitorDate, setToast])

    const changeMonitoringDate = useCallback(() => {
        try {
            if (newDate == '' || !newDate) {
                setToast({
                    text: `Insira uma data para prosseguir`,
                    state: 'info',
                })

                return
            }

            if (!changeStage && !changeDisease && !changePest && !changeWeed && !changeObservation) {
                setToast({
                    text: `Selecione ao menos um item para alterar`,
                    state: 'info',
                })

                return
            }

            setShowChangeDateModal(false)

            setToast({
                text: `Processando...`,
                state: 'loading',
            })

            setSelectedDate(formatDateToYYMMDD(selectedDate, '-'))
            setNewDate(formatDateToYYMMDD(newDate, '-'))

            axios
                .post('/api/properties/monitoring/change-date', {
                    property_crop_join_id: crop,
                    date: selectedDate,
                    new_date: newDate,
                    change_stage: changeStage,
                    change_disease: changeDisease,
                    change_pest: changePest,
                    change_weed: changeWeed,
                    change_observation: changeObservation,
                })
                .then((response) => {
                    if (response.status == 200) {
                        setToast({
                            text: `Data alterada com sucesso`,
                            state: 'success',
                        })

                        setSelectedDate('')
                        setNewDate('')

                        mutate(`/api/properties/monitoring/list/${crop}`)
                    }
                })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }, [changeDisease, changeObservation, changePest, changeStage, changeWeed, crop, newDate, selectedDate, setToast])

    const updateTabStatus = (tabIndex: number, newStatus: FormStateProps) => {
        setFormState((prevState) => {
            const newState = [...prevState]
            newState[tabIndex] = newStatus
            return newState
        })
    }

    const handleEditClick = (date: string) => {
        mutate(`/api/properties/monitoring/list/${crop}`)
        setSelectedDate('')
        setIsEdit(true)
        setSelectedCrops([crop.toString()])
        setSelectedDate(date)
        setShowFormModal(true)
    }

    const handleEditDateClick = (date: string | null) => {
        if (date) {
            setSelectedDate('')
            setSelectedDate(date)
        }
        setShowChangeDateModal(true)
    }

    const openAddModal = () => {
        setIsEdit(false)
        setSelectedCrops([crop.toString()])
        setShowFormModal(true)
    }

    const getFilteredDataByDate = () => (dataMonitoring ? dataMonitoring[selectedDate] || {} : {})

    const filteredStages = useMemo(() => getFilteredDataByDate()?.stages, [dataMonitoring, selectedDate])
    const filteredDiseases = useMemo(() => getFilteredDataByDate()?.diseases, [dataMonitoring, selectedDate])
    const filteredPests = useMemo(() => getFilteredDataByDate()?.pests, [dataMonitoring, selectedDate])
    const filteredWeeds = useMemo(() => getFilteredDataByDate()?.weeds, [dataMonitoring, selectedDate])
    const filteredObservations = useMemo(() => getFilteredDataByDate()?.observations, [dataMonitoring, selectedDate])

    const deleteDateFunction = (date: string) => {
        if (date != '') {
            const parts = date.split('-')

            if (parts.length == 3) {
                const day = parts[0]
                const month = parts[1]
                const year = parts[2]

                setDeleteDate(`${year}-${month}-${day}`)
                setFormatedDate(`${day}/${month}/${year}`)
            }
        }
    }

    const deleteMonitoring = useCallback(() => {
        try {
            setToast({ text: `Excluindo monitoramentos`, state: 'loading' })

            axios
                .post('/api/properties/monitoring/delete', {
                    property_crop_join_id: crop,
                    admin_id: admin.id,
                    date: deleteDate,
                    delete_stage: changeStage,
                    delete_disease: changeDisease,
                    delete_pest: changePest,
                    delete_weed: changeWeed,
                    delete_observation: changeObservation,
                })
                .then((response) => {
                    if (response.status == 200) {
                        setToast({
                            text: `Removidos com sucesso`,
                            state: 'success',
                        })

                        setSelectedDate('')
                        setNewDate('')

                        mutate(`/api/properties/monitoring/list/${crop}`)

                        setShowDeleteCultureModal(false)
                        setChangeStage(false)
                        setChangeDisease(false)
                        setChangePest(false)
                        setChangeWeed(false)
                        setChangeObservation(false)
                    }
                })

            // await updateStatus(
            //     '/api/properties/monitoring/delete',
            //     admin.id,
            //     deleteDate,
            //     deleteDate,
            //     'date',
            //     'property_crop_join_id',
            //     crop,
            // ).then(() => {
            //     setShowDeleteCultureModal(false);
            //     setToast({ text: `Monitoramentos removidos`, state: 'success' });
            //     mutate(`/api/properties/monitoring/list/${crop}`);
            // });
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }, [admin.id, changeDisease, changeObservation, changePest, changeStage, changeWeed, crop, deleteDate, setToast])

    const handleChangeDate = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedMonitorDate(e.target.value)
    }

    const dateValid = (): boolean => {
        if (!selectedMonitorDate) {
            return true
        }

        const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/
        const match = datePattern.exec(selectedMonitorDate)

        if (!match) {
            return true
        }
        const year = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) - 1
        const day = parseInt(match[3], 10)

        const date = new Date(year, month, day)

        return !(date.getFullYear() == year && date.getMonth() == month && date.getDate() == day)
    }

    useEffect(() => {
        if (data) {
            setDataMonitoring(data.management_data)

            if (data.crop) {
                setPath([])

                data.crop.draw_area.split('|||').forEach((item: any) => {
                    const [lat, lng] = item.split(',')

                    setPath((prevPath) => [...prevPath, { lat: parseFloat(lat), lng: parseFloat(lng) }])
                })
            }
        }
    }, [data])

    useEffect(() => {
        if (seedData) {
            setDiseasesList(seedData.diseases)
            setPestsList(seedData.pests)
        }
    }, [seedData])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de monitoramento`, state: 'danger' })
            }
        }
    }, [error])

    useEffect(() => {
        setSelectedTab('estadio')
        setSelectedMonitorDate('')
    }, [showFormModal, showDeleteCultureModal])

    async function exportMonitoring(type: number) {
        const newUrl = `/api/reports/list/${admin.id}/monitoring?export=true&export_type=${type}&property_crop_join_id=${crop}`

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
            <div className={`${styles.defaultTopBox} ${styles.desktop}`}>
                <h5 className={styles.title}>
                    Todos os monitoramentos ({dataMonitoring ? Object.entries(dataMonitoring).length : 0})
                </h5>

                <div className={styles.buttonActions}>
                    <GeralButton
                        smallIcon
                        value={`Exportar PDF`}
                        variant='tertiary'
                        onClick={() => exportMonitoring(2)}
                    />
                    <GeralButton
                        smallIcon
                        value={`Exportar XLSX`}
                        variant='tertiary'
                        onClick={() => exportMonitoring(1)}
                    />
                    <GeralButton variant='secondary' onClick={openAddModal} small>
                        + Adicionar monitoramento
                    </GeralButton>
                </div>
            </div>

            <div className={`${styles.defaultTopBox} ${styles.mobile}`}>
                <h5 className={styles.title}>Todos ({dataMonitoring ? Object.entries(dataMonitoring).length : 0})</h5>

                <div className={styles.buttonActions}>
                    <GeralButton round variant='tertiary' onClick={() => setExportModal(true)}>
                        <IconifyIcon icon='ph:arrow-square-out' />
                    </GeralButton>

                    <GeralButton variant='secondary' onClick={openAddModal} smaller>
                        + Monitoramento
                    </GeralButton>
                </div>
            </div>

            <div className={styles.defaultBodyBox}>
                <GeralTable
                    headers={tableHeaders}
                    headersIcons={tableIcons}
                    gridColumns={`0.6fr 0.8fr repeat(3, 1fr) 0.7fr 1fr`}
                    customClasses={[tableStyles.boxWidth]}>
                    {(isLoading || seedLoading) && <TableSkeleton />}
                    {dataMonitoring &&
                        Object.entries(dataMonitoring).map(([date, modules], index) => (
                            <TableRow
                                key={`monitor-${date}-${index + 1}`}
                                gridColumns={`0.6fr 0.8fr repeat(3, 1fr) 0.7fr 1fr`}>
                                <div data-type='content'>
                                    <p>{formatDateToDDMMYY(date)}</p>
                                </div>

                                <div data-type='content'>
                                    <div className={styles.contentWrap}>
                                        {modules.stages.map((stage: PropertyCropStageProps, index: number) => (
                                            // <LevelTarget
                                            //     key={`stage-${stage.id}-${index}`}
                                            //     galleryIndex={`stage-${stage.id}-${index}`}
                                            //     color={stage.risk}
                                            //     defaultLevel={false}
                                            //     text={getStageName(stage)}
                                            //     images={stage.images}
                                            //     imagePath='property_crop_stages'
                                            // />
                                            <button
                                                key={stage.id}
                                                type='button'
                                                style={{ background: 'none', border: 'none' }}
                                                onClick={() => {
                                                    setTextObservation(`
                                                        ${getStageName(stage)}
                                                        ${
                                                            stage.vegetative_age_text
                                                                ? ` - ${stage.vegetative_age_text}`
                                                                : ''
                                                        }
                                                        ${
                                                            stage.reprodutive_age_text
                                                                ? ` - ${stage.reprodutive_age_text}`
                                                                : ''
                                                        }
                                                    `)
                                                    setShowObservationModal(true)
                                                    setImagePath('property_crop_stages')
                                                    setImageObservation(stage.images)
                                                }}
                                                title='Clique para visualizar o estádio'>
                                                <LevelTarget
                                                    key={`${date}-stage-${stage.id}-${index}`}
                                                    galleryIndex={`${date}-stage-${stage.id}-${index}`}
                                                    color={stage.risk}
                                                    defaultLevel={false}
                                                    text={getStageName(stage)}
                                                    images={stage.images}
                                                    stage={stage}
                                                    imagePath='property_crop_stages'
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div data-type='content'>
                                    <div className={styles.contentWrap}>
                                        {modules.diseases.map((disease: PropertyCropDisease, index: number) => (
                                            <LevelTarget
                                                key={`disease-${disease.disease?.name}-${disease.id}-${index}`}
                                                galleryIndex={`disease-${disease.disease?.name}-${disease.id}-${index}`}
                                                color={disease.risk}
                                                defaultLevel={false}
                                                text={`${disease.disease?.name}${
                                                    disease.incidency > 0
                                                        ? ` - ${formatNumberToBR(disease.incidency)}%`
                                                        : ''
                                                }`}
                                                images={disease.images}
                                                imagePath='property_crop_diseases'
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div data-type='content'>
                                    <div className={styles.contentWrap}>
                                        {modules.pests.map((pest: PropertyCropPest) => (
                                            <LevelTarget
                                                key={`pest-${pest.pest?.name}-${pest.id}-${index}`}
                                                galleryIndex={`pest-${pest.pest?.name}-${pest.id}-${index}`}
                                                color={pest.risk}
                                                defaultLevel={false}
                                                text={`${pest.pest?.name}${
                                                    pest.incidency > 0 ? ` - ${formatNumberToBR(pest.incidency)}%` : ''
                                                }
                                                ${
                                                    pest.quantity_per_meter > 0
                                                        ? `<br>${formatNumberToBR(pest.quantity_per_meter)}/m`
                                                        : ''
                                                }${
                                                    pest.quantity_per_square_meter > 0
                                                        ? `<br>${formatNumberToBR(pest.quantity_per_square_meter)}/m2`
                                                        : ''
                                                }`}
                                                images={pest.images}
                                                imagePath='property_crop_pests'
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div data-type='content'>
                                    <div className={styles.contentWrap}>
                                        {modules.weeds.map((weed: PropertyCropWeed) => (
                                            <LevelTarget
                                                key={`${weed.weed?.name}-${weed.id}-${index}`}
                                                galleryIndex={`${weed.weed?.name}-${weed.id}-${index}`}
                                                color={weed.risk}
                                                defaultLevel={false}
                                                text={weed.weed?.name}
                                                images={weed.images}
                                                imagePath='property_crop_weeds'
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className={styles.contentWrap}>
                                        {modules.observations.map((observation: PropertyCropObservation) => (
                                            <button
                                                key={observation.id}
                                                style={{ background: 'none', border: 'none' }}
                                                onClick={() => {
                                                    setTextObservation(observation.observations)
                                                    setShowObservationModal(true)
                                                    setImagePath('property_crop_observations')
                                                    setImageObservation(observation.images)
                                                }}
                                                title='Clique para visualizar a observação'>
                                                <LevelTarget
                                                    key={`${date}-observation-${observation.id}-${index}`}
                                                    galleryIndex={`${date}-observation-${observation.id}-${index}`}
                                                    color={observation.risk}
                                                    defaultLevel={false}
                                                    text={
                                                        observation.risk == 1
                                                            ? 'Sem risco'
                                                            : observation.risk == 2
                                                              ? 'Atenção'
                                                              : 'Urgência'
                                                    }
                                                    images={observation.images}
                                                    imagePath='property_crop_observations'
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* <div data-type='content'>
                                    <p>{modules.admin ? modules.admin?.name : '--'}</p>
                                </div> */}

                                <div data-type='action'>
                                    <TableActions>
                                        <TableButton
                                            variant='user'
                                            onClick={() => {}}
                                            title={`Responsável: ${modules.admin ? modules.admin?.name : '--'}`}
                                        />

                                        <TableButton
                                            variant='edit'
                                            onClick={() => handleEditClick(date)}
                                            title='Editar monitoramento'
                                        />

                                        <TableButton
                                            variant='map'
                                            onClick={() => {
                                                setManagementDataMapDate(date)
                                                setShowMapModal(true)
                                            }}
                                            title='Visualizar monitoramento no mapa'
                                        />

                                        <TableButton
                                            variant='calendar'
                                            onClick={() => handleEditDateClick(date)}
                                            title='Editar data do monitoramento'
                                        />

                                        {/* <TableButton
                                            href={`/dashboard/propriedades/monitoramento/${crop}/${formatDateToYYMMDD(
                                                date,
                                                '-',
                                            )}`}
                                            variant='see'
                                        /> */}

                                        <TableButton
                                            variant='delete'
                                            title='Remover itens do monitoramento'
                                            onClick={() => {
                                                deleteDateFunction(date)
                                                setShowDeleteCultureModal(!showDeleteCultureModal)
                                            }}
                                        />
                                    </TableActions>
                                </div>
                            </TableRow>
                        ))}

                    {!data && <TableRow emptyString='Nenhum dado encontrado' columnsCount={1} />}
                </GeralTable>
            </div>

            <div className={styles.defaultBottomBox}>
                <div className={styles.contentWrap}>
                    <LevelTarget color='red' defaultLevel={true} />
                    <LevelTarget color='yellow' defaultLevel={true} />
                    <LevelTarget color='green' defaultLevel={true} />
                </div>
            </div>

            <GeralModal
                show={showFormModal}
                setShow={setShowFormModal}
                title={`${isEdit ? 'Editar' : 'Adicionar'} monitoramento`}
                loading={loading}>
                <Suspense fallback={<ElementSkeleton />}>
                    <div className={styles.formMonitorModal}>
                        <div className={styles.group}>
                            {!isEdit && (
                                <div className={stylesReports.filterGroupGap}>
                                    <GeralInput
                                        name='crops_id'
                                        label='Lavouras'
                                        type='select'
                                        onChange={handleChangeSelectedCrops}>
                                        <option value='0'>Selecione</option>

                                        {crops &&
                                            crops.map((crop: CropJoin) => (
                                                <option key={crop.id} value={crop.id}>
                                                    {crop.crop.name} {crop.subharvest_name ?? ''}
                                                </option>
                                            ))}
                                    </GeralInput>

                                    <div className={stylesReports.filterOptions}>
                                        {crops &&
                                            crops.map(
                                                (cropItem: CropJoin) =>
                                                    selectedCrops.includes(cropItem.id.toString()) && (
                                                        <div
                                                            key={cropItem.id}
                                                            className={stylesReports.filterOptionItem}>
                                                            {cropItem.crop.name} {cropItem.subharvest_name ?? ''}
                                                            {cropItem.id != crop && (
                                                                <button
                                                                    onClick={() => removeCrop(cropItem.id.toString())}>
                                                                    <IconifyIcon icon='ph:x' />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ),
                                            )}
                                    </div>
                                </div>
                            )}

                            <div className={styles.tabSwiper}>
                                <GeralTab
                                    headers={modalHeader}
                                    selectedId={selectedTab}
                                    isSwiper
                                    variant='default'
                                    onButtonClick={(e) => {
                                        setSelectedTab((e.target as HTMLInputElement).getAttribute('data-id'))
                                    }}
                                />
                            </div>

                            <div className={styles.content}>
                                <StadiumForm
                                    key='stadiumForm'
                                    cropId={crop}
                                    selectedCrops={selectedCrops}
                                    active={selectedTab == 'estadio'}
                                    updateStatus={(newStatus: FormStateProps) => updateTabStatus(0, newStatus)}
                                    ref={stadiumFormRef}
                                    dataEdit={isEdit ? filteredStages : []}
                                    reset={!showFormModal}
                                    dateTime={selectedMonitorDate}
                                    pathMap={path}
                                />
                                <DiseaseForm
                                    key='diseaseForm'
                                    cropId={crop}
                                    selectedCrops={selectedCrops}
                                    active={selectedTab == 'doenca'}
                                    updateStatus={(newStatus: FormStateProps) => updateTabStatus(1, newStatus)}
                                    ref={diseaseFormRef}
                                    dataEdit={isEdit ? filteredDiseases : []}
                                    reset={!showFormModal}
                                    dateTime={selectedMonitorDate}
                                    diseases={diseasesList}
                                    pathMap={path}
                                />
                                <PestForm
                                    key='pestForm'
                                    cropId={crop}
                                    selectedCrops={selectedCrops}
                                    active={selectedTab == 'praga'}
                                    updateStatus={(newStatus: FormStateProps) => updateTabStatus(2, newStatus)}
                                    ref={pestFormRef}
                                    dataEdit={isEdit ? filteredPests : []}
                                    reset={!showFormModal}
                                    dateTime={selectedMonitorDate}
                                    pests={pestsList}
                                    pathMap={path}
                                />
                                <WeedForm
                                    key='weedForm'
                                    cropId={crop}
                                    selectedCrops={selectedCrops}
                                    active={selectedTab == 'daninha'}
                                    updateStatus={(newStatus: FormStateProps) => updateTabStatus(3, newStatus)}
                                    ref={weedFormRef}
                                    dataEdit={isEdit ? filteredWeeds : []}
                                    reset={!showFormModal}
                                    dateTime={selectedMonitorDate}
                                    pathMap={path}
                                />
                                <ObservationForm
                                    key='observationForm'
                                    cropId={crop}
                                    selectedCrops={selectedCrops}
                                    active={selectedTab == 'observacao'}
                                    updateStatus={(newStatus: FormStateProps) => updateTabStatus(4, newStatus)}
                                    ref={observationFormRef}
                                    dataEdit={isEdit ? filteredObservations : []}
                                    reset={!showFormModal}
                                    dateTime={selectedMonitorDate}
                                    pathMap={path}
                                />
                                <Register
                                    key='registerForm'
                                    cropId={crop}
                                    selectedCrops={selectedCrops}
                                    active={selectedTab == 'registros'}
                                    updateStatus={(newStatus: FormStateProps) => updateTabStatus(5, newStatus)}
                                    reset={!showFormModal}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <GeralButton
                                    disabled={loading || !canSubmit()}
                                    smaller
                                    variant='secondary'
                                    onClick={submitAllForms}>
                                    {isEdit ? 'Salvar' : 'Adicionar'} monitoramento
                                </GeralButton>

                                {isEdit && (
                                    <GeralButton smaller variant='tertiary' onClick={() => handleEditDateClick(null)}>
                                        Alterar data do monitoramento
                                        <IconifyIcon icon='material-symbols:edit-calendar-outline' />
                                    </GeralButton>
                                )}
                            </div>
                        </div>
                    </div>
                </Suspense>
            </GeralModal>

            <GeralModal
                title='Selecione a data'
                show={showDateModal}
                setShow={() => {
                    setSelectedMonitorDate('')
                    setShowDateModal(false)
                }}>
                <div className={styles.dateContent}>
                    <span>A data selecionada será usada para salvar os dados dos seguintes formulários:</span>

                    <div className={styles.list}>
                        {modalHeader.map((tab, index: number) => {
                            const state = formState[index]
                            const submit = state ? state == 1 || state == 3 : false

                            if (!submit) {
                                return <Fragment key={index} />
                            }

                            return <p key={index}>{tab.name}</p>
                        })}
                    </div>

                    <div className={styles.dateField}>
                        <GeralInput
                            defaultValue={selectedMonitorDate}
                            label='Data de monitoramento'
                            name='date'
                            type='date'
                            placeholder='00-00-0000'
                            autoComplete='off'
                            onChange={handleChangeDate}
                            readOnly={loading}
                            required
                        />
                    </div>

                    <GeralButton
                        variant='secondary'
                        type='button'
                        onClick={() => {
                            setShowDateModal(false)
                            submitAllForms()
                        }}
                        disabled={dateValid()}>
                        Continuar
                    </GeralButton>
                </div>
            </GeralModal>

            <GeralModal
                title='Alterar data do monitoramento'
                show={showChangeDateModal}
                setShow={() => {
                    setNewDate('')
                    setShowChangeDateModal(false)
                    setChangeStage(false)
                    setChangeDisease(false)
                    setChangePest(false)
                    setChangeWeed(false)
                    setChangeObservation(false)
                }}>
                <div className={styles.dateContent}>
                    <span>
                        A data selecionada irá alterar a visualização dos monitoramentos cadastrados na data{' '}
                        {formatDateToDDMMYY(selectedDate)}
                    </span>

                    <h3 style={{ marginTop: '30px' }}>Quais monitoramentos você deseja alterar?</h3>

                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                        <GeralInput
                            type='checkbox'
                            label='Estádio'
                            variant='checkbox'
                            checked={changeStage}
                            onChange={() => setChangeStage(!changeStage)}
                        />

                        <GeralInput
                            type='checkbox'
                            label='Doenças'
                            variant='checkbox'
                            checked={changeDisease}
                            onChange={() => setChangeDisease(!changeDisease)}
                        />

                        <GeralInput
                            type='checkbox'
                            label='Daninhas'
                            variant='checkbox'
                            checked={changeWeed}
                            onChange={() => setChangeWeed(!changeWeed)}
                        />

                        <GeralInput
                            type='checkbox'
                            label='Pragas'
                            variant='checkbox'
                            checked={changePest}
                            onChange={() => setChangePest(!changePest)}
                        />

                        <GeralInput
                            type='checkbox'
                            label='Observações'
                            variant='checkbox'
                            checked={changeObservation}
                            onChange={() => setChangeObservation(!changeObservation)}
                        />
                    </div>

                    <div className={styles.dateField}>
                        <GeralInput
                            defaultValue={newDate}
                            label='Data nova de monitoramento'
                            name='date'
                            type='date'
                            placeholder='00-00-0000'
                            autoComplete='off'
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setNewDate(e.target.value)
                            }}
                            readOnly={loading}
                            required
                        />
                    </div>

                    <GeralButton
                        variant='secondary'
                        type='button'
                        onClick={() => {
                            setShowDateModal(false)
                            changeMonitoringDate()
                        }}>
                        Alterar
                    </GeralButton>
                </div>
            </GeralModal>

            <GeralModal
                title='Excluir monitoramentos'
                show={showDeleteCultureModal}
                setShow={() => {
                    setShowDeleteCultureModal(false)
                    setChangeStage(false)
                    setChangeDisease(false)
                    setChangePest(false)
                    setChangeWeed(false)
                    setChangeObservation(false)
                }}>
                <div className={styles.dateContent}>
                    <span>
                        Você tem certeza que deseja remover os monitoramentos cadastrados na data {formatedDate}?
                    </span>

                    <h3 style={{ marginTop: '30px' }}>Quais monitoramentos você deseja remover?</h3>

                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                        <GeralInput
                            type='checkbox'
                            label='Estádio'
                            variant='checkbox'
                            checked={changeStage}
                            onChange={() => setChangeStage((state) => !state)}
                        />

                        <GeralInput
                            type='checkbox'
                            label='Doenças'
                            variant='checkbox'
                            checked={changeDisease}
                            onChange={() => setChangeDisease((state) => !state)}
                        />

                        <GeralInput
                            type='checkbox'
                            label='Daninhas'
                            variant='checkbox'
                            checked={changeWeed}
                            onChange={() => setChangeWeed((state) => !state)}
                        />

                        <GeralInput
                            type='checkbox'
                            label='Pragas'
                            variant='checkbox'
                            checked={changePest}
                            onChange={() => setChangePest((state) => !state)}
                        />

                        <GeralInput
                            type='checkbox'
                            label='Observações'
                            variant='checkbox'
                            checked={changeObservation}
                            onChange={() => setChangeObservation((state) => !state)}
                        />
                    </div>

                    <GeralButton
                        variant='secondary'
                        type='button'
                        onClick={() => {
                            setShowDateModal(false)
                            deleteMonitoring()
                        }}>
                        Remover
                    </GeralButton>
                </div>
            </GeralModal>

            <GeralModal
                title={`Visualizar monitoramento no mapa - ${formatDateToDDMMYY(managementDataMapDate)}`}
                show={showMapModal}
                setShow={() => {
                    setShowMapModal(false)
                    setManagementDataMapDate('')
                }}>
                <div className={styles.mapContent}>
                    {data && data.crop ? (
                        <MapCrop
                            crop={data ? data.crop : null}
                            monitoringData={dataMonitoring ? dataMonitoring[managementDataMapDate] : []}
                        />
                    ) : (
                        'Carregando mapa'
                    )}
                </div>
            </GeralModal>

            <GeralModal
                title={`Visualizar item`}
                show={showObservationModal}
                setShow={() => {
                    setShowObservationModal(false)
                    setTextObservation('')
                }}>
                <div style={{ marginTop: '10px' }}>
                    <hr />
                    <h3 dangerouslySetInnerHTML={{ __html: textObservation }} />

                    <Fancybox>
                        <div className={styles.imagesObservation}>
                            {imagesObservation &&
                                imagesObservation.map((image: any, index: number) => (
                                    <a
                                        key={`observation-image-${index}`}
                                        data-fancybox='gallery'
                                        href={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${imagePath}/${image.image}`}>
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${imagePath}/${image.image}`}
                                            alt={`Imagem ${index}`}
                                            loading='lazy'
                                            fill
                                            style={{ width: '100%', height: 'auto', marginBottom: '10px' }}
                                        />
                                    </a>
                                ))}
                        </div>
                    </Fancybox>
                </div>
            </GeralModal>

            <GeralModal title='Exportar' show={showExportModal} setShow={setExportModal}>
                <div className={styles.modalContent}>
                    <GeralButton value={`Exportar PDF`} variant='tertiary' onClick={() => exportMonitoring(2)}>
                        <IconifyIcon icon='ph:arrow-square-out' />
                    </GeralButton>
                    <GeralButton value={`Exportar XLSX`} variant='tertiary' onClick={() => exportMonitoring(1)}>
                        <IconifyIcon icon='ph:arrow-square-out' />
                    </GeralButton>
                </div>
            </GeralModal>

            {/* <GeralModal
                small
                isDelete
                deleteName={`todos os monitoramentos da data ${formatedDate}?`}
                deleteFunction={deleteMonitoring}
                show={showDeleteCultureModal}
                setShow={setShowDeleteCultureModal}
                title='Excluir monitoramentos'
            /> */}
        </>
    )
}

const Monitoring: FC<MonitoringProps> = ({ crop, crops }) => {
    return (
        <div className={`${styles.defaultBorderContentBox} ${styles.noStyleMobile}`}>
            <Suspense fallback={<ElementSkeleton />}>
                <ErrorBoundary
                    fallbackComponent={<strong className='error-strong'>Erro crítico ao carregar a tabela</strong>}>
                    <GetRows crop={crop} crops={crops} />
                </ErrorBoundary>
            </Suspense>
        </div>
    )
}

export default Monitoring
