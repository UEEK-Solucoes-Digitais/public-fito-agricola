import GeralTable from '@/components/tables/GeralTable'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import tableStyles from '@/components/tables/styles.module.scss'
import { useAdmin } from '@/context/AdminContext'
import { getNumber } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { FC, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import Loading from '../loading'
import { ReportTableProps } from './types.d'

export const RainGaugeTable: FC<ReportTableProps> = ({ currentQuery, setUrl }) => {
    const headers = [
        '#',
        'Propriedade',
        'Cultura',
        'Cultivar',
        'Ano Agrícola',
        'Lavoura',
        'Total',
        'Média do volume',
        'Intervalo sem chuva',
        'Dias com chuva',
        'Dias sem chuva',
        '',
    ]
    const style = `0.4fr 1.2fr 0.5fr 0.8fr 0.5fr 1.2fr 0.6fr 0.7fr 0.7fr 0.5fr 0.5fr 0.01fr`

    const { admin } = useAdmin()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    let pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

    const { data, isLoading } = useSWR(`/api/reports/list/${admin.id}/rain-gauges${currentQuery}${pageParam}`, getFetch)

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        setActivePage(1)
        pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

        const url = `/api/reports/list/${admin.id}/rain-gauges${currentQuery}${pageParam}`
        setUrl(url)
        mutate(url)
    }, [currentQuery])

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 20))
        }
    }, [data])

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <GeralTable
                headers={headers}
                gridColumns={style}
                customClasses={[tableStyles.reportTable, tableStyles.clickableRow]}>
                {data?.reports ? (
                    data?.reports?.map((item: any, index: number) => (
                        <TableRow
                            key={item?.id ?? index + 1}
                            gridColumns={style}
                            href={`/dashboard/propriedades/lavoura/${item?.id}`}>
                            <div data-type='content'>
                                <p>{activePage > 1 ? getNumber(index, activePage) : index + 1}</p>
                            </div>
                            <div data-type='content'>
                                <p title={item.property?.name}>{item.property?.name}</p>
                            </div>

                            <div data-type='content'>
                                <div
                                    title={item.culture_table.replaceAll('<br>', '')}
                                    dangerouslySetInnerHTML={{ __html: item.culture_table }}></div>
                            </div>

                            <div data-type='content'>
                                <div
                                    title={item.culture_code_table.replaceAll('<br>', '')}
                                    dangerouslySetInnerHTML={{ __html: item.culture_code_table }}></div>
                            </div>

                            <div data-type='content'>
                                <p title={item.is_subharvest ? item.subharvest_name : item.harvest.name}>
                                    {item.is_subharvest ? item.subharvest_name : item.harvest.name}
                                </p>
                            </div>

                            <div data-type='content'>
                                <p title={item.crop?.name}>{item.crop?.name ?? '--'}</p>
                            </div>

                            <div data-type='content'>
                                <p title={item.rain_gauge_infos?.total_volume}>
                                    {item.rain_gauge_infos?.total_volume ?? '--'}mm
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={item.rain_gauge_infos?.avg_volume}>
                                    {item.rain_gauge_infos?.avg_volume ?? '--'}mm
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={item.rain_gauge_infos?.rain_interval}>
                                    {item.rain_gauge_infos?.rain_interval ?? '--'}{' '}
                                    {item.rain_gauge_infos?.rain_interval == 1 ? 'dia' : 'dias'}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={item.rain_gauge_infos?.days_with_rain}>
                                    {item.rain_gauge_infos?.days_with_rain ?? '--'}{' '}
                                    {item.rain_gauge_infos?.days_with_rain == 1 ? 'dia' : 'dias'}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={item.rain_gauge_infos?.days_without_rain}>
                                    {item.rain_gauge_infos?.days_without_rain ?? '--'}{' '}
                                    {item.rain_gauge_infos?.days_without_rain == 1 ? 'dia' : 'dias'}
                                </p>
                            </div>
                        </TableRow>
                    ))
                ) : (
                    <p>Nenhum dado encontrado</p>
                )}

                <TablePagination
                    alignLeft={true}
                    pages={pageNumbers}
                    onPageChange={handlePageChange}
                    active={activePage}
                />
            </GeralTable>
        </>
    )
}
