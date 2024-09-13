import GeralTable from '@/components/tables/GeralTable'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import tableStyles from '@/components/tables/styles.module.scss'
import { useAdmin } from '@/context/AdminContext'
import { formatNumberToBR, getNumber } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import { FC, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import Loading from '../loading'
import { ReportTableProps } from './types.d'

export const ProductivityTable: FC<ReportTableProps> = ({ currentQuery, setUrl }) => {
    const headers = [
        '#',
        'Propriedade',
        'Ano Agrícola',
        'Cultura',
        'Lavoura',
        'Área',
        'Plantio',
        'Cultivar',
        `<b>Produtividade(${getMetricUnity()})</b><br>Sc`,
        'Kg',
        '<b>Produção</b><br>Sc',
        'Kg',
        '',
    ]
    const style = `0.4fr 1.2fr 0.8fr 0.6fr 1.3fr 0.4fr 0.7fr 0.8fr repeat(4, 0.6fr) 0.01fr`

    const { admin } = useAdmin()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    let pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

    const { data, isLoading } = useSWR(
        `/api/reports/list/${admin.id}/productivity${currentQuery}${pageParam}`,
        getFetch,
    )

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        setActivePage(1)
        pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

        const url = `/api/reports/list/${admin.id}/productivity${currentQuery}${pageParam}`
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
                customClasses={[tableStyles.reportTable, tableStyles.clickableRow, tableStyles.withPaddingTop]}>
                {data && data.reports ? (
                    data.reports.map((item: any, index: number) => (
                        <TableRow
                            key={item?.id ?? index + 1}
                            gridColumns={style}
                            href={`/dashboard/propriedades/lavoura/${item?.property_crop.id}`}>
                            <div data-type='content'>
                                <p>{activePage > 1 ? getNumber(index, activePage) : index + 1}</p>
                            </div>
                            <div data-type='content'>
                                <p title={item.property_crop?.property?.name}>{item.property_crop?.property?.name}</p>
                            </div>

                            <div data-type='content'>
                                <p title={item.property_crop?.harvest.name}>{item.property_crop?.harvest.name}</p>
                            </div>

                            <div data-type='content'>
                                <div
                                    title={item.culture_table.replaceAll('<br>', '')}
                                    dangerouslySetInnerHTML={{ __html: item.culture_table }}></div>
                            </div>

                            <div data-type='content'>
                                <p
                                    title={`${item.property_crop?.crop?.name} ${item.property_crop?.subharvest_name ?? ''}`}>
                                    {item.property_crop?.crop?.name ?? '--'} {item.property_crop?.subharvest_name ?? ''}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p
                                    title={formatNumberToBR(
                                        item.data_seed ? item.data_seed.area : item.property_crop?.crop?.area,
                                    )}>
                                    {formatNumberToBR(
                                        item.data_seed ? item.data_seed.area : item.property_crop?.crop?.area,
                                    ) ?? '--'}
                                </p>
                            </div>

                            <div data-type='content'>
                                <p title={item.date_plant}>{item.date_plant}</p>
                            </div>

                            <div data-type='content'>
                                <div
                                    title={item.culture_code_table.replaceAll('<br>', '')}
                                    dangerouslySetInnerHTML={{ __html: item.culture_code_table }}></div>
                            </div>

                            <div data-type='content'>
                                <p title={item.productivity_per_hectare}>
                                    {item.productivity_per_hectare ? item.productivity_per_hectare : '--'}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={item.productivity}>
                                    {item.productivity ? formatNumberToBR(item.productivity).split(',')[0] : '--'}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={item.total_production_per_hectare}>
                                    {item.total_production_per_hectare ? item.total_production_per_hectare : '--'}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={formatNumberToBR(item.total_production)}>
                                    {formatNumberToBR(item.total_production)
                                        ? formatNumberToBR(item.total_production).split(',')[0]
                                        : '--'}
                                </p>
                            </div>

                            <div data-type='content'></div>
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
