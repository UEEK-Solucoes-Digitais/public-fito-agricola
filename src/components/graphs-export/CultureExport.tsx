'use client'
import Loading from '@/app/dashboard/loading'
import styles from '@/app/dashboard/properties/styles.module.scss'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableRow from '@/components/tables/TableRow'
import { formatNumberToBR, getActualDateWithHour } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
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
import Image from 'next/image'
import { FC, useEffect, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import useSWR from 'swr'
import fitoBrand from '../../../public/brand/new-logo.png'

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

export const CultureExport: FC<{ query: string }> = ({ query }) => {
    const { data, isLoading } = useSWR(query, getFetch)

    const [colorsPie, setColorsPie] = useState<string[]>([])
    const [pieData, setPieData] = useState<number[]>([])
    const [pieLabels, setPieLabels] = useState<string[]>([])
    const [labelRef, setLabelRef] = useState<string[]>([])
    const [valueRef, setValueRef] = useState<number[]>([])

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
                color: '#3F4141', // Defina a cor do texto
                anchor: 'center' as const,
                align: 'left' as const,
                offset: -80,
                clamp: true,
                font: {
                    size: 16, // Tamanho da fonte
                    weight: 'bold' as const, // Espessura da fonte
                },
                formatter: (_: unknown, context: any) => {
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

    const pieChart = {
        labels: pieLabels,
        datasets: [
            {
                label: 'Porcentagem',
                data: pieData,
                backgroundColor: colorsPie,
                hoverOffset: 1,
            },
        ],
    }

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

    useEffect(() => {
        if (data) {
            const labels: string[] = []
            const labelsRef: string[] = []
            const pieData: number[] = []
            const valueData: number[] = []

            if (Object.keys(data.total_area_per_culture).length > 1) {
                const sortedPairs = Object.entries(data.total_area_per_culture).sort(
                    (a, b) => (b[1] as number) - (a[1] as number),
                ) // Ordena em ordem descendente

                sortedPairs.forEach(([label, value]) => {
                    labels.push(`${label} (${data.total_ha_per_culture[label]} ${getMetricUnity()})`)
                    labelsRef.push(label)
                    pieData.push(value as number)
                    valueData.push(data.total_ha_per_culture[label] as number)
                })
            } else {
                const sortedPairs = Object.entries(data.total_area_per_culture_code).sort(
                    (a, b) => (b[1] as number) - (a[1] as number),
                ) // Ordena em ordem descendente

                sortedPairs.forEach(([label, value]) => {
                    labels.push(`${label} (${data.total_ha_per_culture_code[label]} ${getMetricUnity()})`)
                    labelsRef.push(label)
                    pieData.push(value as number)
                    valueData.push(data.total_ha_per_culture_code[label] as number)
                })
            }

            setPieData(pieData)
            setPieLabels(labels)
            setLabelRef(labelsRef)
            setValueRef(valueData)

            // Novo bloco para gerar gradientes
            // const canvas = document.createElement('canvas');
            // const ctx = canvas.getContext('2d');
            // const chartArea = { left: 0, top: 0, right: canvas.width, bottom: canvas.height };
            // const gradients = generateUniqueGradients(ctx, chartArea, labels.length);

            // setGradientColors(gradients); // Use os gradientes gerados

            const colors = labels.map(() => generateRandomColor())
            setColorsPie(colors)

            // nao remover essa linha, ela é utilizada no gráfico do celular como webview para saber a altura necessária para exibir o gráfico
            console.log(`Labels length:${labels.length}`)
        }
    }, [data])

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            {data.is_different && (
                <div className={styles.differentBox}>
                    <IconifyIcon icon='lucide:triangle-alert' />
                    <p>A área da lavoura é diferente da área total de plantio, revise os lançamentos de sementes</p>
                </div>
            )}

            <div className={styles.defaultBorderContentBox} style={{ boxShadow: 'none' }}>
                <div className={`${styles.boxHeader} ${styles.pressBoxHeader}`}>
                    <Image src={fitoBrand} height={50} width={126} alt='Logo Fito Agrícola' priority />
                    <p>
                        {getActualDateWithHour()}
                        <br />
                        Fito Consultoria Agrícola Ltda. Av. Nívio Castelano, 849 - Centro.
                        <br />
                        Lagoa Vermelha - RS.
                    </p>
                </div>
                <div className={styles.boxHeader}>
                    <div className={styles.reportDetails}>
                        <div className={styles.reportDetailsItem}>
                            <div className={styles.content}>
                                <IconifyIcon icon='ph:user-square' />
                                <p>{data?.geral_infos[0] ?? '--'}</p>
                            </div>
                        </div>

                        <div className={styles.reportDetailsItem}>
                            <div className={styles.content}>
                                <IconifyIcon icon='solar:calendar-outline' />
                                <p>{data?.geral_infos[1] ?? '--'}</p>
                            </div>
                        </div>

                        <div className={styles.reportDetailsItem}>
                            <div className={styles.content}>
                                <IconifyIcon icon='solar:leaf-linear' />
                                <p>{data?.geral_infos[2] ?? '--'}</p>
                            </div>
                        </div>

                        <div className={styles.reportDetailsItem}>
                            <div className={styles.content}>
                                <IconifyIcon icon='ph:plant' />
                                <p>{data?.geral_infos[3] ?? '--'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.boxHeader}>
                    <h3>
                        Área total - {data ? formatNumberToBR(data.total_area) : 0} {getMetricUnity()}
                    </h3>
                </div>
                <div className={styles.chartWithInfo}>
                    <div className={styles.chartWrap}>
                        <Pie data={pieChart} options={optionsPie} />
                    </div>
                    <div className={styles.chartInfo}>
                        <GeralTable
                            headers={['Nome', 'Área', '%', '']}
                            gridColumns={'1fr 1fr 1fr 0.01fr'}
                            customClasses={[tableStyles.cultureTable]}>
                            {pieLabels.map((_: string, index: number) => (
                                <TableRow gridColumns={'1fr 1fr 1fr 0.01fr'} key={`row-${index}`}>
                                    <div data-type='content'>
                                        <div className={styles.colorWrapper}>
                                            <span
                                                style={{
                                                    background: `${colorsPie[index]}`,
                                                    // background: `linear-gradient(45deg, ${colorsPie[index][0]}, ${colorsPie[index][1]})`,
                                                }}
                                            />
                                            {labelRef[index]}
                                        </div>
                                    </div>
                                    <div data-type='content'>
                                        {valueRef[index]} {getMetricUnity()}
                                    </div>
                                    <div data-type='content'>
                                        <p>
                                            {data
                                                ? `${formatNumberToBR(
                                                      Object.keys(data.total_area_per_culture).length > 1
                                                          ? data.total_area_per_culture[labelRef[index]]?.toString()
                                                          : data.total_area_per_culture_code[
                                                                labelRef[index]
                                                            ]?.toString(),
                                                  )}%`
                                                : '0'}
                                        </p>
                                    </div>
                                </TableRow>
                            ))}
                        </GeralTable>
                    </div>
                </div>
            </div>
        </>
    )
}
