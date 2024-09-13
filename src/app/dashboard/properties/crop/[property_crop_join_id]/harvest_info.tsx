'use client'

import { RainGauge } from '@/@types/RainGauge'
import Loading from '@/app/dashboard/loading'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import inputStyles from '@/components/inputs/styles.module.scss'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TableRow from '@/components/tables/TableRow'
import GeralTab from '@/components/tabs/GeralTab'
import { AccessConsts } from '@/consts/AccessConsts'
import { useAdmin } from '@/context/AdminContext'
import { useSubTab } from '@/context/SubtabContext'
import { useNotification } from '@/context/ToastContext'
import api from '@/utils/api'
import useDebounce from '@/utils/debounce'
import { formatNumberToBR, formatNumberToReal, getActualDate } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getCurrency, getMetricUnity } from '@/utils/getMetricUnity'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import {
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import { Chart, Line, Pie } from 'react-chartjs-2'
import useSWR, { mutate } from 'swr'
import styles from '../../styles.module.scss'

ChartJS.register(
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController,
    ArcElement,
    ChartDataLabels,
)

interface PageProps {
    propertyCropJoinId: number
}

const tableHeaders = ['Volume', 'Data', 'Ações']

const tabHeaders = [
    {
        id: 'chuva',
        name: 'Chuva',
        icon: 'ph:cloud-rain',
    },
    {
        id: 'doenca',
        name: 'Doenças',
        icon: 'mingcute:search-line',
    },
    {
        id: 'custos',
        name: 'Custos',
        icon: 'mynaui:dollar',
    },
]

export default function HarvestInfo({ propertyCropJoinId }: PageProps) {
    const { setToast } = useNotification()

    const { data, isLoading, error } = useSWR(
        `/api/properties/read-crop-havest-details/${propertyCropJoinId}`,
        getFetch,
    )

    const [labelsRainGauge, setLabelsRainGauge] = useState<string[]>([])
    const [datasetRainGauge, setDatasetRainGauge] = useState<string[]>([])
    const [datasetRainGaugeTotalVolume, setDatasetRainGaugeTotalVolume] = useState<string[]>([])

    const [labelsDisease, setLabelsDisease] = useState<string[]>([])
    const [namesDisease, setNamesDisease] = useState<string[]>([])
    const [datasetDiseases, setDatasetDiseases] = useState<any>([])

    const [showRainGaugeModal, setShowRainGaugeModal] = useState(false)
    const [isReadingRainGauge, setIsReadingRainGauge] = useState(false)
    const [showDeleteRainGaugeModal, setShowDeleteRainGaugeModal] = useState(false)
    const [deleteId, setDeleteId] = useState(0)

    const { selectedSubTab, setSelectedSubTab } = useSubTab()
    const searchParams = useSearchParams()
    const searchTab = searchParams.get('subtab')
    const pathname = usePathname()

    const [rowEdit, setRowEdit] = useState<{ [key: number]: boolean }>({})
    const [rowData, setRowData] = useState<{ [key: number]: RainGauge }>({})
    const [rowDataAdd, setRowDataAdd] = useState<any>({
        volumes: [0],
        dates: [getActualDate()],
    })

    const [newRow, setNewRow] = useState(false)
    const { admin } = useAdmin()

    const rainRef = useRef<HTMLDivElement>(null)
    const diseaseRef = useRef<HTMLDivElement>(null)
    const costRef = useRef<HTMLDivElement>(null)

    const [lastPlantRainGauge, setLastPlantRainGauge] = useState('')
    const [lastPlantDisease, setLastPlantDisease] = useState('')

    const [costPerPackage, setCostPerPackage] = useState(0)

    const [endRainGauge, setEndRainGauge] = useState(getActualDate())
    const [endDisease, setEndDisease] = useState(getActualDate())

    const debouncedLastPlantRainGauge = useDebounce(lastPlantRainGauge, 1000)
    const debouncedLastPlantDisease = useDebounce(lastPlantDisease, 1000)

    const debouncedEndPlantRainGauge = useDebounce(endRainGauge, 1000)
    const debouncedEndPlantDisease = useDebounce(endDisease, 1000)

    const [filterRainGauge, setFilterRainGauge] = useState('custom')
    const [filterDisease, setFilterDisease] = useState('custom')

    const [totalCosts, setTotalCosts] = useState(0)
    const [allPercentages, setAllPercentages] = useState<any>([])
    const [allPrices, setAllPrices] = useState<any>([])
    const [allPricesPerProperty, setAllPricesPerProperty] = useState<any>([])
    const [colorsPie] = useState<string[]>([
        '#58925E',
        '#8ABB6E',
        '#9D9516',
        '#FAE41C',
        '#064E43',
        '#F8FC79',
        '#9AF566',
        '#45E15E',
    ])
    const [pieLabels, setPieLabels] = useState<string[]>([])

    const [dayWithRain, setDayWithRain] = useState(0)
    const [rainInterval, setRainInterval] = useState(0)
    const [dayWithoutRain, setDayWithoutRain] = useState(0)
    const [avgVolume, setAvgVolume] = useState(0)
    const [totalVolume, setTotalVolume] = useState(0)

    const [dataDisease, setDataDisease] = useState<any>({
        labels: [],
        datasets: [],
    })

    const [dataRainGauge, setDataRainGauge] = useState<any>({
        labels: [],
        datasets: [],
    })

    const [isInitialMount, setIsInitialMount] = useState(true)

    const handleChangeTab = async (e: MouseEvent<HTMLButtonElement>) => {
        const tab = (e.target as HTMLButtonElement).getAttribute('data-id')

        if (tab && tab != selectedSubTab) {
            setSelectedSubTab(tab)
        }
    }

    const generateRandomColor = () => {
        // Gerar um valor entre 0x00 e 0xFF para cada componente de cor
        const red = Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
        const green = Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
        const blue = Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')

        return `#${red}${green}${blue}`
    }

    function getOptions(label: string) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Data',
                        padding: 0,
                        font: {
                            size: 15,
                        },
                    },
                    grid: {
                        color: 'rgb(217,217,217)',
                    },
                    ticks: {
                        font: {
                            size: 12,
                        },
                        autoSkip: !!(label == 'Milímetros' && data && Object.keys(data.rain_gauges).length > 12),
                        maxTicksLimit:
                            label == 'Milímetros' && data && Object.keys(data.rain_gauges).length > 12 ? 15 : undefined, // ajuste esse número conforme necessário
                    },
                },
                y: {
                    grid: {
                        color: 'rgb(217,217,217)',
                    },
                    title: {
                        display: true,
                        text: label,
                        padding: 0,
                        font: {
                            size: 15,
                        },
                    },
                    ticks: {
                        stepSize: 10,
                        font: {
                            size: 12,
                        },
                    },
                },
            },
            plugins: {
                datalabels: {
                    display: false,
                },
                legend: {
                    labels: {
                        boxHeight: 12,
                        useBorderRadius: true,
                        borderRadius: 6,
                        boxWidth: 12,
                        font: {
                            size: 18,
                        },
                    },
                },
                tooltips: {
                    labels: {},
                },
            },
        }
    }

    const pieChart = {
        labels: pieLabels,
        datasets: [
            {
                label: 'Porcentagem',
                data: Object.values(allPercentages),
                backgroundColor: colorsPie,
                hoverOffset: 1,
            },
        ],
    }

    const optionsPie = {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                display: false,
            },
            tooltips: {
                labels: {},
            },
            datalabels: {
                color: '#fff', // Defina a cor do texto
                anchor: 'center' as const,
                align: 'center' as const,
                offset: -80,
                clamp: true,
                font: {
                    size: 16, // Tamanho da fonte
                    weight: 'bold' as const, // Espessura da fonte
                },
                formatter: (_: any, context: any) => {
                    if (
                        context.chart.data.labels.length < 4 ||
                        (context.dataIndex < 3 && context.chart.data.datasets[0].data[context.dataIndex] > 5)
                    ) {
                        return context.chart.data.labels[context.dataIndex]
                    } else {
                        return ''
                    }
                    // Ou qualquer outra lógica para exibir o texto que você deseja
                },
            },
        },
    }

    const handleUserInputChange = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: any) => {
        const { name, value } = e.target

        setRowData((prevStates) => ({
            ...prevStates,
            [id]: { ...prevStates[id], [name]: value },
        }))
    }

    const handleAddInput = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        const { name, value } = e.target

        const values = rowDataAdd[name as keyof any]

        values[index] = value

        setRowDataAdd((prevData: any) => ({ ...prevData, [name]: values }))
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
            if (id == 0 ? isDataAddValid() : isObjectValid(rowData[id])) {
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
                        property_crop_join_id: propertyCropJoinId,
                    })
                    .then((response) => {
                        if (response.status == 200) {
                            setToast({
                                text: `Registro ${id == 0 ? 'criado' : 'atualizado'}`,
                                state: 'success',
                            })

                            setRowEdit((prevStates) => ({
                                ...prevStates,
                                [id]: !prevStates[id],
                            }))

                            if (id == 0) {
                                setRowDataAdd({
                                    volumes: [0],
                                    dates: [getActualDate()],
                                })

                                // setNewRow(false);
                            }

                            mutate(`/api/properties/read-crop-havest-details/${propertyCropJoinId}`)
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

    const deleteRainGauge = async () => {
        try {
            setToast({ text: `Excluindo registro`, state: 'loading' })

            await updateStatus('/api/properties/rain-gauge/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteRainGaugeModal(false)

                setToast({ text: `Registro excluído`, state: 'success' })
                mutate(`/api/properties/read-crop-havest-details/${propertyCropJoinId}`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const filterGraph = (type: number) => {
        let url = ''

        if (type == 1) {
            url = `/api/properties/filter-rain-gauge/${propertyCropJoinId}/${filterRainGauge}/${debouncedLastPlantRainGauge}/${debouncedEndPlantRainGauge}`
        } else {
            url = `/api/properties/filter-disease/${propertyCropJoinId}/${filterDisease}/${debouncedLastPlantDisease}/${debouncedEndPlantDisease}`
        }

        setToast({
            text: 'Carregando informações',
            state: 'loading',
        })

        axios
            .get(url)
            .then((response) => {
                setToast({ text: 'Filtro aplicado', state: 'success' })

                if (type == 1) {
                    // Configuração inicial para rain gauges
                    setDatasetRainGauge(Object.values(response.data.rain_gauges))
                    setLabelsRainGauge(Object.keys(response.data.rain_gauges))
                    setDatasetRainGaugeTotalVolume(Object.values(response.data.rain_gauges_total_volume))
                    const initialEditState: { [key: number]: boolean } = {}
                    response.data.rain_gauges_register.forEach((rain: RainGauge) => {
                        initialEditState[rain.id] = false
                    })
                    setRowEdit(initialEditState)

                    const initialFormState: { [key: number]: RainGauge } = {}

                    initialFormState[0] = {
                        id: 0,
                        // data atual
                        date: getActualDate(),
                        volume: 0,
                    }

                    response.data.rain_gauges_register.forEach((rain: RainGauge) => {
                        initialFormState[rain.id] = {
                            id: rain.id,
                            date: rain.date,
                            volume: rain.volume,
                        }
                    })
                    setRowData(initialFormState)

                    setDayWithRain(response.data.rain_gauge_infos.days_with_rain)
                    setRainInterval(response.data.rain_gauge_infos.rain_interval)
                    setDayWithoutRain(response.data.rain_gauge_infos.days_without_rain)
                    setAvgVolume(response.data.rain_gauge_infos.avg_volume)
                    setTotalVolume(response.data.rain_gauge_infos.total_volume)
                } else {
                    // Configuração inicial para doenças
                    const labelsDisease: string[] = Object.keys(response.data.diseases)
                    setLabelsDisease(labelsDisease)

                    const diseasesNames: string[] = []
                    const datasetDiseases: any = []

                    Object.keys(response.data.diseases).forEach((disease: any) => {
                        datasetDiseases[disease] = []
                        Object.keys(response.data.diseases[disease]).forEach((diseaseName: any) => {
                            datasetDiseases[disease][diseaseName] = response.data.diseases[disease][diseaseName]
                            if (diseasesNames.indexOf(diseaseName) == -1) {
                                diseasesNames.push(diseaseName)
                            }
                        })
                    })
                    setDatasetDiseases(datasetDiseases)
                }
            })
            .catch((error: any) => {
                WriteLog(error, 'error')
                const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                setToast({ text: message, state: 'danger' })
            })
    }

    function getSearchTab() {
        // removendo subtab da query caso haja
        const search = window.location.search
        const searchParams = new URLSearchParams(search)
        searchParams.delete('subtab')
        return searchParams.toString()
    }

    useEffect(() => {
        if (selectedSubTab && selectedSubTab != null) {
            window.history.pushState(
                { filter: true },
                selectedSubTab,
                `${pathname}?${getSearchTab()}&subtab=${selectedSubTab}`,
            )

            switch (selectedSubTab) {
                case 'chuva':
                    rainRef.current?.scrollIntoView({ behavior: 'smooth' })
                    break
                case 'doenca':
                    diseaseRef.current?.scrollIntoView({ behavior: 'smooth' })
                    break
                case 'custos':
                    costRef.current?.scrollIntoView({ behavior: 'smooth' })
                    break
            }
        }
    }, [selectedSubTab])

    useEffect(() => {
        if (searchTab && searchTab != null) {
            setSelectedSubTab(searchTab)
        } else if (selectedSubTab == '' || selectedSubTab == null) {
            setSelectedSubTab('chuva')
        }
    }, [])

    useEffect(() => {
        if (data) {
            // Configuração inicial para rain gauges
            setDatasetRainGauge(Object.values(data.rain_gauges))
            setLabelsRainGauge(Object.keys(data.rain_gauges))
            setDatasetRainGaugeTotalVolume(Object.values(data.rain_gauges_total_volume))

            // Configuração inicial para doenças
            const labelsDisease: string[] = Object.keys(data.diseases)
            setLabelsDisease(labelsDisease)

            const diseasesNames: string[] = []
            const datasetDiseases: any = []

            Object.keys(data.diseases).forEach((disease: any) => {
                datasetDiseases[disease] = []

                Object.keys(data.diseases[disease]).forEach((diseaseName: any) => {
                    datasetDiseases[disease][diseaseName] = data.diseases[disease][diseaseName]
                    if (diseasesNames.indexOf(diseaseName) == -1) {
                        diseasesNames.push(diseaseName)
                    }
                })
            })

            setDatasetDiseases(datasetDiseases)
            setNamesDisease(diseasesNames)

            const initialEditState: { [key: number]: boolean } = {}
            data.rain_gauges_register.forEach((rain: any) => {
                initialEditState[rain.id] = false
            })
            setRowEdit(initialEditState)

            const initialFormState: { [key: number]: RainGauge } = {}

            initialFormState[0] = {
                id: 0,
                // data atual
                date: getActualDate(),
                volume: 0,
            }

            data.rain_gauges_register.forEach((rain: RainGauge) => {
                initialFormState[rain.id] = {
                    id: rain.id,
                    date: rain.date,
                    volume: rain.volume,
                }
            })
            setRowData(initialFormState)

            setLastPlantRainGauge(data.last_plant_rain_gauges)
            setEndRainGauge(data.end_plant_rain_gauges ?? getActualDate())
            setLastPlantDisease(data.last_plant_disease)

            setTotalCosts(data.total_costs)
            // setSeedPercentage(data.seed_percentage);
            // setFertilizerPercentage(data.fertilizer_percentage);

            setAllPercentages(data.product_types_percentage)
            setAllPrices(data.product_types_price)
            setAllPricesPerProperty(data.product_types_price_per_property)

            // colors.push(generateRandomColor());
            // colors.push(generateRandomColor());

            // for (let i = 0; i < Object.keys(data.product_types_percentage).length; i++) {
            //     colors.push(generateRandomColor());
            // }

            const labels: string[] = []
            // labels.push('Semente');
            // labels.push('Fertilizante');
            labels.push(...Object.keys(data.product_types_percentage))
            setPieLabels(labels)

            // setColorsPie(colors);

            // Novo bloco para gerar gradientes

            // setGradientColors(gradients);
            setDayWithRain(data.rain_gauge_infos.days_with_rain)
            setRainInterval(data.rain_gauge_infos.rain_interval)
            setDayWithoutRain(data.rain_gauge_infos.days_without_rain)
            setAvgVolume(data.rain_gauge_infos.avg_volume)
            setTotalVolume(data.rain_gauge_infos.total_volume)

            setTimeout(() => {
                setIsInitialMount(false)
            }, 2000)
        }
    }, [data, isLoading])

    function getMonthName(month: number) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

        return months[month - 1]
    }

    useEffect(() => {
        setDataRainGauge({
            labels: [
                ...datasetRainGauge.map((_: any, index: number) => {
                    return data && labelsRainGauge.length > 0 && labelsRainGauge[index]
                        ? `${labelsRainGauge[index].split('/')[0]}/${getMonthName(
                              parseInt(labelsRainGauge[index].split('/')[1]),
                          )}`
                        : ''
                }),
            ],
            datasets: [
                {
                    type: 'bar' as const,
                    label: 'Volume',
                    backgroundColor: '#3C45AD',
                    borderRadius: 20,
                    data: datasetRainGauge,
                },
                {
                    type: 'line' as const,
                    label: 'Volume acumulado',
                    backgroundColor: '#C2C5ED',
                    data: datasetRainGaugeTotalVolume,
                    borderColor: '#C2C5ED',
                    borderWidth: 2,
                    tension: 0.3,
                },
            ],
        })
    }, [labelsRainGauge, datasetRainGauge, datasetRainGaugeTotalVolume])

    useEffect(() => {
        if (labelsDisease.length == 0 || !datasetDiseases) {
            return
        }

        const colors = [
            '#FF4500',
            '#008000',
            '#0000FF',
            '#8B4513',
            '#FFFF00',
            '#FFA500',
            '#00FFFF',
            '#008080',
            '#FF0000',
            '#800000',
            '#800080',
            '#C0C0C0',
            '#000000',
            '#FFC0CB',
            '#FFD700',
            '#000080',
            '#A52A2A',
            '#FFFFF0',
            '#F0E68C',
            '#E6E6FA',
        ]

        setDataDisease({
            labels: labelsDisease,
            datasets: namesDisease.map((diseaseName: any, index: number) => {
                // const color = generateRandomColor();
                return {
                    label: diseaseName,
                    data: labelsDisease.map((label: any) => {
                        return datasetDiseases[label][diseaseName] ?? []
                    }),
                    fill: false,
                    backgroundColor: colors[index] ?? generateRandomColor(),
                    borderColor: colors[index] ?? generateRandomColor(),
                    tension: 0.3,
                }
            }),
        })
    }, [labelsDisease, datasetDiseases, namesDisease])

    useEffect(() => {
        if (!isInitialMount) {
            filterGraph(1)
        }
    }, [debouncedLastPlantRainGauge, debouncedEndPlantRainGauge, filterRainGauge])

    useEffect(() => {
        if (!isInitialMount) {
            filterGraph(2)
        }
    }, [debouncedLastPlantDisease, debouncedEndPlantDisease, filterDisease])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados`, state: 'danger' })
            }
        }
    }, [error])

    function getTotalCostsPerProperty() {
        let total = 0
        for (const key in allPricesPerProperty) {
            total += parseFloat(allPricesPerProperty[key].replaceAll('.', '').replaceAll(',', '.'))
        }
        return total
    }

    async function reportFile(type: number) {
        try {
            setToast({ text: `Requisitando arquivo, isso pode demorar alguns minutos`, state: 'loading' })

            const response = await api.get(
                `/api/reports/list/${admin.id}/rain-gauges-detailed?property_crop_join_id=${propertyCropJoinId}&export=true&export_type=${type}&date_begin=${lastPlantRainGauge}&date_end=${endRainGauge}`,
            )

            if (response.data.status == 200 && response.data.file_dump) {
                // checkFile(response.data.file_dump);
                const fileUrl = response.data.file_dump
                setToast({ text: `O download será iniciado em instantes`, state: 'success' })

                if (typeof window != 'undefined') {
                    window.open(fileUrl, '_blank')
                }
            } else {
                setToast({ text: response.data.msg || 'Não foi possível iniciar o download', state: 'danger' })
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <div className={styles.tabMobile}>
                <GeralTab headers={tabHeaders} selectedId={selectedSubTab} onButtonClick={handleChangeTab} isDropdown />
            </div>

            <div
                hidden={!!(selectedSubTab && selectedSubTab != null && selectedSubTab != 'chuva')}
                className={`${styles.defaultBorderContentBox} ${styles.noStyleMobile}`}>
                <div className={styles.anchor} ref={rainRef} />
                <div className={`${styles.boxHeader} ${styles.noBorder}`}>
                    <h3>Pluviômetro</h3>

                    <div className={styles.boxHeaderButtons}>
                        <GeralButton
                            smaller
                            smallIcon
                            value={`Adicionar registro`}
                            variant='secondary'
                            onClick={() => {
                                setNewRow(true)
                                setIsReadingRainGauge(false)
                                setShowRainGaugeModal(!showRainGaugeModal)
                            }}>
                            <IconifyIcon icon='ph:plus' />
                        </GeralButton>

                        <GeralButton
                            smaller
                            smallIcon
                            customClasses={[styles.desktopButton]}
                            value={`Exportar XLSX`}
                            variant='tertiary'
                            onClick={() => reportFile(1)}>
                            <IconifyIcon icon='ph:arrow-square-out' />
                        </GeralButton>
                        <GeralButton
                            smaller
                            smallIcon
                            customClasses={[styles.desktopButton]}
                            value={`Exportar`}
                            variant='tertiary'
                            onClick={() => {
                                window.open(
                                    `/dashboard/exportar-graficos/${propertyCropJoinId}${
                                        filterRainGauge == 'custom'
                                            ? `?start_date_rain_gauge=${debouncedLastPlantRainGauge}&end_date_rain_gauge=${debouncedEndPlantRainGauge}`
                                            : `?type=${filterRainGauge}&rain_gauge=true`
                                    }`,
                                    '_blank',
                                )
                            }}>
                            <IconifyIcon icon='ph:arrow-square-out' />
                        </GeralButton>
                    </div>
                    <div className={styles.mobileInputs}>
                        {filterRainGauge == 'custom' && (
                            <div className={`${inputStyles.customRainGaugeInputs} ${inputStyles.mobile}`}>
                                <GeralInput
                                    variant='secondary'
                                    name='start_date'
                                    type='date'
                                    label='Inicial'
                                    max={getActualDate()}
                                    defaultValue={lastPlantRainGauge}
                                    customClasses={[`${inputStyles.rainGaugeInput}`]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setLastPlantRainGauge(event.target.value)
                                    }}
                                />
                                <GeralInput
                                    variant='secondary'
                                    name='end_date'
                                    type='date'
                                    label='Final'
                                    max={getActualDate()}
                                    defaultValue={endRainGauge}
                                    customClasses={[`${inputStyles.rainGaugeInput}`]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setEndRainGauge(event.target.value)
                                    }}
                                />
                            </div>
                        )}

                        <div className={`${inputStyles.customRainGaugeInputs} ${inputStyles.mobile}`}>
                            <GeralInput
                                variant='secondary'
                                name='start_date'
                                type='select'
                                label='Buscar dentro do'
                                selectType={2}
                                defaultValue={filterRainGauge}
                                customClasses={[`${inputStyles.rainGaugeInput}`]}
                                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                                    setFilterRainGauge(event.target.value)
                                }}>
                                <option value='custom'>Personalizado</option>
                                <option value='weekly'>Semanal</option>
                                <option value='monthly'>Mensal</option>
                                <option value='quarter'>Trimestral</option>
                                <option value='semester'>Semestral</option>
                                <option value='anual'>Anual</option>
                            </GeralInput>
                        </div>
                    </div>
                </div>

                <div className={styles.defaultBorderContentBox}>
                    <div className={styles.boxHeader}>
                        <h3>Precipitação</h3>

                        <div className={`${styles.boxHeaderButtons} ${styles.desktopButton}`}>
                            {filterRainGauge == 'custom' && (
                                <div className={`${inputStyles.customRainGaugeInputs} ${inputStyles.desktop}`}>
                                    <GeralInput
                                        variant='secondary'
                                        name='start_date'
                                        type='date'
                                        label='Inicial'
                                        max={getActualDate()}
                                        defaultValue={lastPlantRainGauge}
                                        customClasses={[`${inputStyles.rainGaugeInput}`]}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                            setLastPlantRainGauge(event.target.value)
                                        }}
                                    />
                                    <GeralInput
                                        variant='secondary'
                                        name='end_date'
                                        type='date'
                                        label='Final'
                                        max={getActualDate()}
                                        defaultValue={endRainGauge}
                                        customClasses={[`${inputStyles.rainGaugeInput}`]}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                            setEndRainGauge(event.target.value)
                                        }}
                                    />
                                </div>
                            )}

                            <div className={`${inputStyles.customRainGaugeInputs} ${inputStyles.desktop}`}>
                                <GeralInput
                                    variant='secondary'
                                    name='start_date'
                                    type='select'
                                    label='Buscar dentro do'
                                    selectType={2}
                                    defaultValue={filterRainGauge}
                                    customClasses={[`${inputStyles.rainGaugeInput}`]}
                                    onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                                        setFilterRainGauge(event.target.value)
                                    }}>
                                    <option value='custom'>Personalizado</option>
                                    <option value='weekly'>Semanal</option>
                                    <option value='monthly'>Mensal</option>
                                    <option value='quarter'>Trimestral</option>
                                    <option value='semester'>Semestral</option>
                                    <option value='anual'>Anual</option>
                                </GeralInput>
                            </div>
                        </div>
                        <div className={styles.exportButtons}>
                            <GeralButton
                                smaller
                                value={`Consultar registros`}
                                variant='tertiary'
                                onClick={() => {
                                    setIsReadingRainGauge(true)
                                    setNewRow(false)

                                    setShowRainGaugeModal(!showRainGaugeModal)
                                }}
                            />

                            <GeralButton
                                smaller
                                smallIcon
                                customClasses={[styles.mobileButton]}
                                value={`Exportar`}
                                variant='tertiary'
                                onClick={() => {
                                    window.open(
                                        `/dashboard/exportar-graficos/${propertyCropJoinId}${
                                            filterRainGauge == 'custom'
                                                ? `?start_date_rain_gauge=${debouncedLastPlantRainGauge}&end_date_rain_gauge=${debouncedEndPlantRainGauge}`
                                                : `?type=${filterRainGauge}&rain_gauge=true`
                                        }`,
                                        '_blank',
                                    )
                                }}>
                                <IconifyIcon icon='ph:arrow-square-out' />
                            </GeralButton>
                        </div>
                    </div>
                    <div className={styles.chartWrap}>
                        <div className={styles.canvaWrap}>
                            <Chart type='bar' data={dataRainGauge} options={getOptions('Milímetros')} />
                        </div>
                    </div>
                    <div className={styles.chartMetrics}>
                        <div className={styles.metricItem}>
                            <h3>{totalVolume}</h3>
                            <p>Total (mm)</p>
                        </div>
                        <div className={styles.metricItem}>
                            <h3>{avgVolume}</h3>
                            <p>Média (mm)</p>
                        </div>
                        <div className={styles.metricItem}>
                            <h3>{dayWithRain}</h3>
                            <p>Dias com chuva</p>
                        </div>
                        <div className={styles.metricItem}>
                            <h3>{rainInterval}</h3>
                            <p>Maior intervalo sem chuva</p>
                        </div>
                        <div className={styles.metricItem}>
                            <h3>{dayWithoutRain}</h3>
                            <p>Dias sem chuva</p>
                        </div>
                    </div>
                </div>
            </div>

            <div
                hidden={!!(selectedSubTab && selectedSubTab != null && selectedSubTab != 'doenca')}
                className={`${styles.defaultBorderContentBox} ${styles.noStyleMobile}`}>
                <div className={styles.anchor} ref={diseaseRef} />
                <div className={`${styles.boxHeader} ${styles.noBorder}`}>
                    <h3>Doenças</h3>

                    <div className={styles.boxHeaderButtons}>
                        {filterDisease == 'custom' && (
                            <div className={inputStyles.customRainGaugeInputs}>
                                <GeralInput
                                    variant='secondary'
                                    name='start_date'
                                    type='date'
                                    label='Inicial'
                                    max={getActualDate()}
                                    defaultValue={lastPlantDisease}
                                    customClasses={[`${inputStyles.rainGaugeInput}`]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setLastPlantDisease(event.target.value)
                                    }}
                                />
                                <GeralInput
                                    variant='secondary'
                                    name='end_date'
                                    type='date'
                                    label='Final'
                                    max={getActualDate()}
                                    defaultValue={endDisease}
                                    customClasses={[`${inputStyles.rainGaugeInput}`]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setEndDisease(event.target.value)
                                    }}
                                />
                            </div>
                        )}

                        <div className={inputStyles.customRainGaugeInputs}>
                            <GeralInput
                                variant='secondary'
                                name='start_date'
                                type='select'
                                label='Buscar dentro do'
                                selectType={2}
                                defaultValue={filterDisease}
                                customClasses={[`${inputStyles.rainGaugeInput}`]}
                                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                                    setFilterDisease(event.target.value)
                                }}>
                                <option value='custom'>Personalizado</option>
                                <option value='weekly'>Semanal</option>
                                <option value='monthly'>Mensal</option>
                                <option value='quarter'>Trimestral</option>
                                <option value='semester'>Semestral</option>
                                <option value='anual'>Anual</option>
                            </GeralInput>
                        </div>
                    </div>
                </div>

                <div className={styles.defaultBorderContentBox}>
                    <div className={styles.boxHeader}>
                        <h3>Incidência</h3>
                        <div className={styles.boxHeaderButtons}>
                            <GeralButton
                                smaller
                                smallIcon
                                value={`Exportar`}
                                variant='tertiary'
                                onClick={() => {
                                    window.open(
                                        `/dashboard/exportar-graficos/${propertyCropJoinId}${
                                            filterDisease == 'custom'
                                                ? `?start_date_disease=${debouncedLastPlantDisease}&end_date_disease=${debouncedEndPlantDisease}`
                                                : `?type=${filterDisease}&disease=true`
                                        }`,
                                        '_blank',
                                    )
                                }}>
                                <IconifyIcon icon='ph:arrow-square-out' />
                            </GeralButton>
                        </div>
                    </div>

                    <div className={styles.chartWrap}>
                        <div className={styles.canvaWrap}>
                            <Line data={dataDisease} options={getOptions('Porcentagem')} />
                        </div>
                    </div>
                </div>
            </div>

            <div
                hidden={!!(selectedSubTab && selectedSubTab != null && selectedSubTab != 'custos')}
                className={styles.defaultBorderContentBox}>
                <div className={styles.anchor} ref={costRef} />
                <div className={`${styles.boxHeader} ${styles.noBorder}`}>
                    <h3>Custos</h3>

                    <div className={styles.boxHeaderButtons}>
                        <GeralButton
                            smaller
                            smallIcon
                            value={`Exportar`}
                            variant='tertiary'
                            onClick={() => {
                                window.open(`/dashboard/exportar-graficos/${propertyCropJoinId}?costs=true`, '_blank')
                            }}>
                            <IconifyIcon icon='ph:arrow-square-out' />
                        </GeralButton>
                    </div>
                </div>

                {admin.level.split(',').includes(AccessConsts.COSTS) && (
                    <div className={`${styles.defaultBorderContentBox} ${styles.noStyleMobile}`}>
                        <div className={`${styles.boxHeader} ${styles.costHeader}`}>
                            <h3>Custo (%)</h3>

                            <div className={styles.costInput}>
                                <h3>Valor ({getCurrency()}) por saco de 60kg:</h3>

                                <GeralInput
                                    type='text'
                                    maskVariant='price'
                                    variant='inline'
                                    defaultValue={costPerPackage.toString()}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setCostPerPackage(
                                            parseFloat(event.target.value.replaceAll('.', '').replaceAll(',', '.')),
                                        )
                                    }}
                                />
                            </div>

                            <div className={styles.boxHeaderButtons}>
                                Total de custos — <b>{formatNumberToReal(totalCosts)}</b>
                            </div>
                        </div>
                        <div className={styles.chartWithInfo}>
                            <div className={styles.chartWrap}>
                                <Pie data={pieChart} options={optionsPie} />
                            </div>
                            <div className={styles.chartInfo}>
                                <GeralTable
                                    headers={[
                                        'Classe',
                                        `<b>Custo total</b><br>${getCurrency()}`,
                                        'sc',
                                        `<b>Custo por unidade de área</b><br>${getCurrency()}/${getMetricUnity()}`,
                                        'sc',
                                        '%',
                                        '',
                                    ]}
                                    gridColumns={'0.8fr 0.6fr 0.6fr 0.6fr 0.6fr 0.4fr 0.01fr'}
                                    customClasses={[tableStyles.cultureTable, tableStyles.withPaddingTop]}>
                                    {pieLabels.map((label: string, index: number) => (
                                        <TableRow
                                            gridColumns={'0.8fr 0.6fr 0.6fr 0.6fr 0.6fr 0.4fr 0.01fr'}
                                            key={`${index}-${label}`}>
                                            <div data-type='content'>
                                                <div className={styles.colorWrapper}>
                                                    <span
                                                        style={{
                                                            background: colorsPie[index],
                                                        }}
                                                    />
                                                    {label}
                                                </div>
                                            </div>
                                            <div data-type='content'>{allPrices[label]}</div>
                                            <div>
                                                {costPerPackage > 0
                                                    ? `${formatNumberToBR(parseFloat(allPrices[label].replaceAll('.', '').replaceAll(',', '.')) / costPerPackage, 2)}`
                                                    : 0}
                                            </div>
                                            <div data-type='content'>{allPricesPerProperty[label]}</div>
                                            <div>
                                                {costPerPackage > 0
                                                    ? `${formatNumberToBR(parseFloat(allPricesPerProperty[label].replaceAll('.', '').replaceAll(',', '.')) / costPerPackage, 2)}`
                                                    : 0}
                                            </div>
                                            <div data-type='content'>
                                                <p>{allPercentages[label]?.toString().replace('.', ',')}</p>
                                            </div>
                                        </TableRow>
                                    ))}

                                    <TableRow gridColumns={'0.8fr 0.6fr 0.6fr 0.6fr 0.6fr 0.4fr 0.01fr'}>
                                        <div data-type='content'>
                                            <div className={styles.colorWrapper}>
                                                <b>Total</b>
                                            </div>
                                        </div>
                                        <div data-type='content'>
                                            {getCurrency()}
                                            {formatNumberToBR(totalCosts)}
                                        </div>
                                        <div>
                                            {costPerPackage > 0
                                                ? `${formatNumberToBR(totalCosts / costPerPackage, 2)}`
                                                : 0}
                                        </div>
                                        <div data-type='content'>
                                            {getCurrency()}
                                            {formatNumberToBR(getTotalCostsPerProperty())}
                                        </div>
                                        <div>
                                            {costPerPackage > 0
                                                ? `${formatNumberToBR(getTotalCostsPerProperty() / costPerPackage, 2)}`
                                                : 0}
                                        </div>
                                        <div data-type='content'>100%</div>
                                    </TableRow>
                                </GeralTable>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <GeralModal
                show={showRainGaugeModal}
                setShow={setShowRainGaugeModal}
                title={isReadingRainGauge ? 'Registros pluviômetros' : 'Adicionar registro'}>
                <div className={styles.tableMargin}>
                    <GeralTable
                        headers={tableHeaders}
                        gridColumns={`repeat(${tableHeaders.length}, 1fr)`}
                        customClasses={[tableStyles.rainGaugeTable]}>
                        {newRow &&
                            rowDataAdd.volumes.map((_volume: number, index: number) => (
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
                                                <GeralButton
                                                    variant='noStyle'
                                                    type='button'
                                                    onClick={removeItem(index)}>
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

                        {isReadingRainGauge &&
                            data?.rain_gauges_register?.map((rainGauge: RainGauge) => (
                                <TableRow
                                    key={`rain-${rainGauge.id}`}
                                    gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
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
                </div>

                {!isReadingRainGauge && (
                    <GeralButton
                        smaller
                        smallIcon
                        value={`Adicionar registro`}
                        variant='secondary'
                        onClick={() => {
                            setNewRow(!newRow)
                        }}>
                        <IconifyIcon icon='ph:plus' />
                    </GeralButton>
                )}
            </GeralModal>

            <GeralModal
                small
                isDelete
                deleteName='o registro dessa data?'
                deleteFunction={deleteRainGauge}
                show={showDeleteRainGaugeModal}
                setShow={setShowDeleteRainGaugeModal}
                title='Excluir registro'
            />
        </>
    )
}
