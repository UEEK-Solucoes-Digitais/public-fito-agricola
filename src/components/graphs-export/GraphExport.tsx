'use client'

import fitoBrand from '@/../public/brand/new-logo.png'
import Loading from '@/app/dashboard/loading'
import boxStyles from '@/app/dashboard/properties/styles.module.scss'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import tableStyles from '@/components/tables/styles.module.scss'
import { formatDateToDDMMYYYY, formatNumberToReal } from '@/utils/formats'
import { getCurrentDate } from '@/utils/getDate'
import getFetch from '@/utils/getFetch'
import { getCurrency, getMetricUnity } from '@/utils/getMetricUnity'
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
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Chart, Line, Pie } from 'react-chartjs-2'
import useSWR from 'swr'
import GeralTable from '../tables/GeralTable'
import TableRow from '../tables/TableRow'
import styles from './styles.module.scss'

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
)

const GraphExport: React.FC<{ typeGraph: number }> = ({ typeGraph }) => {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const splitPathname = pathname?.split('/')
    const cropId = parseInt(splitPathname[splitPathname.length - 1])

    const [lastPlantRainGauge, endRainGauge] = [
        searchParams.get('start_date_rain_gauge'),
        searchParams.get('end_date_rain_gauge'),
    ]
    const [lastPlantDisease, endDisease] = [
        searchParams.get('start_date_disease'),
        searchParams.get('end_date_disease'),
    ]

    const [rain_gauge] = [searchParams.get('rain_gauge')]

    const [disease] = [searchParams.get('disease')]
    const [type] = [searchParams.get('type')]
    const filterCosts = searchParams.get('costs')

    const { data, isLoading } = useSWR(
        `/api/properties/read-crop-havest-details/${cropId}?start_date_rain_gauge=${lastPlantRainGauge}&end_date_rain_gauge=${endRainGauge}&start_date_disease=${lastPlantDisease}&end_date_disease=${endDisease}&costs=${filterCosts}&type=${type}`,
        getFetch,
    )

    const [labelsRainGauge, setLabelsRainGauge] = useState<string[]>([])
    const [datasetRainGauge, setDatasetRainGauge] = useState<string[]>([])
    const [datasetRainGaugeTotalVolume, setDatasetRainGaugeTotalVolume] = useState<string[]>([])

    const [labelsDisease, setLabelsDisease] = useState<string[]>([])
    const [namesDisease, setNamesDisease] = useState<string[]>([])
    const [datasetDiseases, setDatasetDiseases] = useState<any>([])

    const [totalCosts, setTotalCosts] = useState(0)
    const [allPercentages, setAllPercentages] = useState<any>([])
    const [allPrices, setAllPrices] = useState<any>([])
    const [allPricesPerProperty, setAllPricesPerProperty] = useState<any>([])

    const colorsPie = ['#58925E', '#8ABB6E', '#9D9516', '#FAE41C', '#064E43', '#F8FC79', '#9AF566', '#45E15E']

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

    const generateRandomColor = () => {
        // Gerar um valor entre 0x00 e 0xFF para cada componente de cor
        const red = Math.floor(Math.random() * 128 + 128)
            .toString(16)
            .padStart(2, '0')
        const green = Math.floor(Math.random() * 128 + 128)
            .toString(16)
            .padStart(2, '0')
        const blue = Math.floor(Math.random() * 128 + 128)
            .toString(16)
            .padStart(2, '0')

        return `#${red}${green}${blue}`
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
                            label == 'Milímetros' && data && Object.keys(data.rain_gauges).length > 12
                                ? 10
                                : undefined, // ajuste esse número conforme necessário
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

    const optionsPie = {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                display: false,
            },
            tooltips: {
                labels: {
                    font: {},
                },
            },
        },
    }

    function getMonthName(month: number) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        return months[month - 1]
    }

    function getLabelsRainGauge(labels: string[]) {
        const newLabels: string[] = []

        labels.forEach((label: string) => {
            const labelArray = label.split('/')
            newLabels.push(`${labelArray[0]}/${getMonthName(parseInt(labelArray[1]))}`)
        })

        return newLabels
    }

    useEffect(() => {
        setDataRainGauge({
            labels: getLabelsRainGauge(labelsRainGauge),
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

            setTotalCosts(data.total_costs)
            setAllPercentages(data.product_types_percentage)
            setAllPrices(data.product_types_price)
            setAllPricesPerProperty(data.product_types_price_per_property)

            const labels: string[] = []
            labels.push(...Object.keys(data.product_types_percentage))
            setPieLabels(labels)

            setDayWithRain(data.rain_gauge_infos.days_with_rain)
            setRainInterval(data.rain_gauge_infos.rain_interval)
            setDayWithoutRain(data.rain_gauge_infos.days_without_rain)
            setAvgVolume(data.rain_gauge_infos.avg_volume)
            setTotalVolume(data.rain_gauge_infos.total_volume)

            if (typeGraph == 1) {
                setTimeout(() => {
                    window.print()
                }, 1000)
            }
        }
    }, [data])

    function getType() {
        switch (type) {
            case 'weekly':
                return 'Semanal'
            case 'monthly':
                return 'Mensal'
            case 'quarter':
                return 'Trimestral'
            case 'semester':
                return 'Semestral'
            case 'anual':
                return 'Anual'
        }
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            {typeGraph == 1 ? (
                <>
                    <div className={`${styles.flexContent} d-print-none`} style={{ margin: '15px' }}>
                        <GeralButton
                            variant='primary'
                            onClick={() => {
                                window.print()
                            }}
                            small
                            value='Gerar pdf'
                        />
                    </div>

                    <div className={styles.exportPage}>
                        <table className={styles.tableContent}>
                            <thead>
                                <tr>
                                    <th>
                                        <div className={styles.flexContent}>
                                            <Image
                                                src={fitoBrand}
                                                height={50}
                                                width={126}
                                                alt='Logo Fito Agrícola'
                                                priority
                                                className={styles.logo}
                                            />
                                            <p>{getCurrentDate()}</p>
                                        </div>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    <td>
                                        <div className={styles.bodyContent}>
                                            <h1>Relatórios</h1>

                                            <div className={styles.reportDetails}>
                                                <div className={styles.reportDetailsItem}>
                                                    <div className={styles.header}>
                                                        <IconifyIcon icon='ph:user-square' />
                                                        Propriedade
                                                    </div>
                                                    <div className={styles.content}>
                                                        <p>{data?.join?.property?.name}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.reportDetailsItem}>
                                                    <div className={styles.header}>
                                                        <IconifyIcon icon='solar:calendar-outline' />
                                                        Ano agrícola
                                                    </div>
                                                    <div className={styles.content}>
                                                        <p>{data?.join?.harvest?.name}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.reportDetailsItem}>
                                                    <div className={styles.header}>
                                                        <IconifyIcon icon='solar:leaf-linear' />
                                                        Lavoura
                                                    </div>
                                                    <div className={styles.content}>
                                                        <p>{data?.join?.crop?.name}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {((lastPlantRainGauge && endRainGauge) || rain_gauge) && (
                                                <div className={`${styles.chartWrap} ${styles.first}`}>
                                                    <h3>
                                                        Pluviômetro -{' '}
                                                        {lastPlantRainGauge && endRainGauge
                                                            ? `${formatDateToDDMMYYYY(
                                                                  lastPlantRainGauge,
                                                              )} - ${formatDateToDDMMYYYY(endRainGauge)}`
                                                            : getType()}
                                                    </h3>
                                                    <div
                                                        className={`${boxStyles.defaultBorderContentBox} ${boxStyles.forExport}`}>
                                                        <div className={boxStyles.boxHeader}>
                                                            <h3>Precipitação</h3>
                                                        </div>
                                                        <div className={boxStyles.chartWrap}>
                                                            <Chart
                                                                type='bar'
                                                                data={dataRainGauge}
                                                                options={getOptions('Milímetros')}
                                                            />
                                                        </div>
                                                        <div className={boxStyles.chartMetrics}>
                                                            <div className={boxStyles.metricItem}>
                                                                <h3>{totalVolume}</h3>
                                                                <p>Total (mm)</p>
                                                            </div>
                                                            <div className={boxStyles.metricItem}>
                                                                <h3>{avgVolume}</h3>
                                                                <p>Média (mm)</p>
                                                            </div>
                                                            <div className={boxStyles.metricItem}>
                                                                <h3>{dayWithRain}</h3>
                                                                <p>Dias com chuva</p>
                                                            </div>
                                                            <div className={boxStyles.metricItem}>
                                                                <h3>{rainInterval}</h3>
                                                                <p>Maior intervalo sem chuva</p>
                                                            </div>
                                                            <div className={boxStyles.metricItem}>
                                                                <h3>{dayWithoutRain}</h3>
                                                                <p>Dias sem chuva</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {((lastPlantDisease && endDisease) || disease) && (
                                                <div
                                                    className={`${styles.chartWrap} ${
                                                        !lastPlantRainGauge && !endRainGauge
                                                            ? styles.first
                                                            : styles.wMoreMargin
                                                    }`}>
                                                    <h3>
                                                        Doenças -{' '}
                                                        {lastPlantDisease && endDisease
                                                            ? `${formatDateToDDMMYYYY(
                                                                  lastPlantDisease,
                                                              )} - ${formatDateToDDMMYYYY(endDisease)}`
                                                            : getType()}
                                                    </h3>
                                                    <div
                                                        className={`${boxStyles.defaultBorderContentBox} ${boxStyles.forExport}`}>
                                                        <div className={boxStyles.boxHeader}>
                                                            <h3>Incidência</h3>
                                                        </div>
                                                        <div className={boxStyles.chartWrap}>
                                                            <Line
                                                                data={dataDisease}
                                                                options={getOptions('Incidência')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {filterCosts && (
                                                <div
                                                    className={`${styles.chartWrap} ${
                                                        !lastPlantRainGauge &&
                                                        !endRainGauge &&
                                                        !lastPlantDisease &&
                                                        !endDisease
                                                            ? styles.first
                                                            : ''
                                                    }`}>
                                                    <h3>Custos</h3>
                                                    <div
                                                        className={`${boxStyles.defaultBorderContentBox} ${boxStyles.forExport}`}>
                                                        <div className={boxStyles.boxHeader}>
                                                            <h3>Custo total (em %)</h3>

                                                            <div className={boxStyles.boxHeaderButtons}>
                                                                Total de custos —{' '}
                                                                <b>{formatNumberToReal(totalCosts)}</b>
                                                            </div>
                                                        </div>
                                                        <div className={boxStyles.chartWithInfo}>
                                                            <div className={boxStyles.chartWrap}>
                                                                <Pie data={pieChart} options={optionsPie} />
                                                            </div>
                                                            <div className={boxStyles.chartInfo}>
                                                                <GeralTable
                                                                    headers={[
                                                                        'Classe',
                                                                        getCurrency(),
                                                                        `${getCurrency()}/${getMetricUnity()}`,
                                                                        '%',
                                                                        '',
                                                                    ]}
                                                                    gridColumns={'1.2fr 0.8fr 0.8fr 0.5fr 0.01fr'}
                                                                    customClasses={[tableStyles.cultureExportTable]}>
                                                                    {pieLabels.map((label: string, index: number) => (
                                                                        <TableRow
                                                                            gridColumns={
                                                                                '1.2fr 0.8fr 0.8fr 0.5fr 0.01fr'
                                                                            }
                                                                            key={`row-${index}`}>
                                                                            <div data-type='content'>
                                                                                <div className={styles.colorWrapper}>
                                                                                    <div
                                                                                        style={{
                                                                                            background: `${colorsPie[index]}`,
                                                                                        }}>
                                                                                        .
                                                                                    </div>
                                                                                    {label}
                                                                                </div>
                                                                            </div>
                                                                            <div data-type='content'>
                                                                                {allPrices[label]}
                                                                            </div>
                                                                            <div data-type='content'>
                                                                                {allPricesPerProperty[label]}
                                                                            </div>
                                                                            <div data-type='content'>
                                                                                <p>
                                                                                    {allPercentages[label]
                                                                                        ?.toString()
                                                                                        .replace('.', ',')}
                                                                                </p>
                                                                            </div>
                                                                        </TableRow>
                                                                    ))}
                                                                </GeralTable>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>

                            <tfoot>
                                <tr>
                                    <td>
                                        <div className={styles.flexContent}>
                                            <Image
                                                src={fitoBrand}
                                                height={50}
                                                width={126}
                                                alt='Logo Fito Agrícola'
                                                priority
                                                className={styles.logo}
                                            />
                                            <p>{getCurrentDate()}</p>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            ) : (
                <div className={styles.chartExport}>
                    {((lastPlantRainGauge && endRainGauge) || rain_gauge) && (
                        <Chart type='bar' data={dataRainGauge} options={getOptions('Milímetros')} />
                    )}

                    {((lastPlantDisease && endDisease) || disease) && (
                        <Line data={dataDisease} options={getOptions('Incidência')} />
                    )}
                </div>
            )}
        </>
    )
}

export default GraphExport
