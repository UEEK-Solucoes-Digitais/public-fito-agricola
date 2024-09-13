import LevelTarget from '@/components/elements/LevelTarget'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { formatDateToDDMMYYYY, formatNumberToBR, getNumber, getProductType } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import { useRouter } from 'nextjs-toploader/app'
import { FC, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import Loading from '../loading'
import dropdownStyles from '../styles.module.scss'
import { ReportTableProps } from './types.d'

export const InputsTable: FC<ReportTableProps> = ({ currentQuery, setUrl }) => {
    const [headers, setHeaders] = useState<string[]>(['#', 'Propriedade', 'Lavoura', 'Cultura', 'Ano Agrícola', ''])
    const [style, setStyle] = useState(`0.2fr 1.2fr repeat(3, 1fr)  0.01fr`)

    const [headersMerged, setHeadersMerged] = useState([
        'Data',
        'Tipo',
        'Produto',
        `Dose/${getMetricUnity()}`,
        'Quantidade',
        '',
    ])
    const [styleMerged, setStyleMerged] = useState(`repeat(5, 1fr) 0.01fr`)
    const [visualizationType, setVisualizationType] = useState(1)
    const [rowOpen, setRowOpen] = useState<{ [key: number]: boolean }>({})
    const { admin } = useAdmin()
    const router = useRouter()

    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    let pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

    const { data, isLoading } = useSWR(`/api/reports/list/${admin.id}/inputs${currentQuery}${pageParam}`, getFetch)

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        setActivePage(1)
        pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

        // verificando o valor do visualization_type da currentQuery
        if (currentQuery.includes('visualization_type')) {
            const newVisualizationType = currentQuery.split('visualization_type=')[1].split('&')[0]
            setVisualizationType(parseInt(newVisualizationType))
        }

        const url = `/api/reports/list/${admin.id}/inputs${currentQuery}${pageParam}`
        setUrl(url)
        mutate(url)
    }, [currentQuery])

    useEffect(() => {
        let headers: string[] = []
        let style = ''

        let headersMerged: string[] = []
        let styleMerged = ''

        if (!visualizationType || visualizationType == 1) {
            headers = ['#', 'Propriedade', 'Lavoura', 'Cultura', 'Ano Agrícola', '']
            style = `0.2fr 1.2fr repeat(3, 1fr)  0.01fr`

            headersMerged = ['Data', 'Tipo', 'Produto', `Dose/${getMetricUnity()}`, 'Quantidade', '']
            styleMerged = `repeat(5, 1fr) 0.01fr`
        } else if (visualizationType == 2) {
            headers = ['#', 'Propriedade', 'Lavoura', 'Cultura', 'Ano Agrícola', '']
            style = `0.2fr 1.2fr repeat(3, 1fr)  0.01fr`

            headersMerged = ['Tipo', 'Produto', `Dose/${getMetricUnity()}`, 'Quantidade', '']
            styleMerged = `repeat(4, 1fr) 0.01fr`
        } else {
            headers = ['#', 'Propriedade', 'Cultura', 'Ano Agrícola', '']
            style = `0.2fr 1.2fr repeat(2, 1fr)  0.01fr`

            headersMerged = ['Tipo', 'Produto', `Dose/${getMetricUnity()}`, 'Quantidade', '']
            styleMerged = `repeat(4, 1fr) 0.01fr`
        }

        setHeaders(headers)
        setStyle(style)

        setHeadersMerged(headersMerged)
        setStyleMerged(styleMerged)
    }, [visualizationType])

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 20))
        }
    }, [data])

    useEffect(() => {
        if (data && data.reports) {
            const initialEditState: { [key: number]: boolean } = {}

            data.reports.forEach((report: any) => {
                initialEditState[report.id] = rowOpen[report.id] ?? true
            })

            setRowOpen(initialEditState)
        }
    }, [data])

    const changeRowOpen = (id: number) => {
        setRowOpen((prevStates) => ({
            ...prevStates,
            [id]: !prevStates[id],
        }))
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <GeralTable headers={headers} gridColumns={style} customClasses={[tableStyles.reportTable]}>
            {data && data.reports ? (
                data.reports.map((item: any, index: number) => (
                    <div
                        key={item.id}
                        className={`${dropdownStyles.withDropdown} ${rowOpen[item.id] ? dropdownStyles.opened : ''}`}>
                        <div
                            className={dropdownStyles.dropdownInfo}
                            style={{ cursor: 'pointer' }}
                            onClick={() => changeRowOpen(item.id)}>
                            <TableRow key={`parent-${item.id}-${index}`} gridColumns={style}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <IconifyIcon icon='lucide:chevron-down' />
                                    <p>{activePage > 1 ? getNumber(index, activePage) : index + 1}</p>
                                </div>
                                <div data-type='content'>
                                    <p title={visualizationType == 3 ? item.name : item.property?.name}>
                                        {visualizationType == 3 ? item.name : item.property?.name}
                                    </p>
                                </div>
                                {visualizationType !== 3 && item.crop?.name && (
                                    <div data-type='content'>
                                        <p
                                            title='Clique para ir para a página detalhes da lavoura'
                                            className={tableStyles.linkWrap}
                                            onClick={() => router.push(`/dashboard/propriedades/lavoura/${item?.id}`)}>
                                            <LevelTarget
                                                customClass='darker'
                                                color={1}
                                                defaultLevel={false}
                                                text={`${item.crop?.name} ${item.subharvest_name ?? ''}`}
                                            />
                                        </p>
                                    </div>
                                )}
                                <div data-type='content'>
                                    <p title={item.culture_table}>{item.culture_table}</p>
                                </div>
                                <div data-type='content'>
                                    <p>
                                        {visualizationType == 3
                                            ? (item.harvest?.name ?? item.harvest)
                                            : item.harvest?.name}
                                    </p>
                                </div>
                            </TableRow>
                        </div>
                        {rowOpen[item.id] && (
                            <div className={`${dropdownStyles.dropdownMenu} ${dropdownStyles.panelDropdown}`}>
                                <GeralTable
                                    customClasses={[tableStyles.dropdownPanel]}
                                    headers={headersMerged}
                                    gridColumns={styleMerged}>
                                    {Object.keys(item.merged_data_input).map((itemNested: any) => (
                                        <TableRow key={`nested-${item.id}-${itemNested}`} gridColumns={styleMerged}>
                                            {visualizationType == 1 && (
                                                <div data-type='content'>
                                                    <p
                                                        title={formatDateToDDMMYYYY(
                                                            item.merged_data_input[itemNested].date,
                                                        )}>
                                                        {formatDateToDDMMYYYY(item.merged_data_input[itemNested].date)}
                                                    </p>
                                                </div>
                                            )}

                                            <div data-type='content'>
                                                <p>
                                                    {item.merged_data_input[itemNested].type
                                                        ? item.merged_data_input[itemNested].type == 1
                                                            ? 'Fertilizante'
                                                            : getProductType(
                                                                  item.merged_data_input[itemNested].product
                                                                      ?.object_type,
                                                              )
                                                        : 'Sementes'}
                                                </p>
                                            </div>

                                            <div data-type='content'>
                                                <p title={item.merged_data_input[itemNested].product?.name}>
                                                    {item.merged_data_input[itemNested].product?.name ?? '--'}
                                                </p>
                                            </div>
                                            <div data-type='content'>
                                                <p>
                                                    {formatNumberToBR(
                                                        item.merged_data_input[itemNested].type
                                                            ? item.merged_data_input[itemNested].dosage
                                                            : item.merged_data_input[itemNested].kilogram_per_ha,
                                                    )}
                                                </p>
                                            </div>
                                            <div data-type='content'>
                                                <p>
                                                    {formatNumberToBR(
                                                        (visualizationType !== 3
                                                            ? item.merged_data_input[itemNested].type
                                                                ? item.merged_data_input[itemNested].dosage *
                                                                  (item.crop ? item.crop?.area : 0)
                                                                : item.merged_data_input[itemNested].kilogram_per_ha *
                                                                  (item.crop ? item.crop?.area : 0)
                                                            : (item.merged_data_input[itemNested].total_dosage ?? 0)
                                                        ).toFixed(2),
                                                    )}
                                                </p>
                                            </div>
                                        </TableRow>
                                    ))}
                                    <TableRow key={`nested-${item.id}-total`} gridColumns={styleMerged}>
                                        <div data-type='content'></div>
                                        {visualizationType == 1 && <div data-type='content'></div>}
                                        <div data-type='content'>
                                            <p>TOTAL</p>
                                        </div>
                                        <div data-type='content'>{formatNumberToBR(item.sum_dosages)}</div>
                                        <div data-type='content'>
                                            {formatNumberToBR(
                                                (visualizationType !== 3
                                                    ? item.sum_dosages * (item.crop ? item.crop.area : 0)
                                                    : (item.total_products ?? 0)
                                                ).toFixed(2),
                                            )}
                                        </div>
                                    </TableRow>
                                </GeralTable>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p>Nenhum dado encontrado</p>
            )}

            <TablePagination alignLeft={true} pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />
        </GeralTable>
    )
}
