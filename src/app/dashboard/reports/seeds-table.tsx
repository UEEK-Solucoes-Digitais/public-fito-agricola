import GeralTable from '@/components/tables/GeralTable'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import tableStyles from '@/components/tables/styles.module.scss'
import { useAdmin } from '@/context/AdminContext'
import { formatDateToDDMMYYYY, formatNumberToBR, getNumber } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import { FC, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import Loading from '../loading'
import { ReportTableProps } from './types.d'

export const SeedTable: FC<ReportTableProps> = ({ currentQuery, setUrl }) => {
    const headers = [
        '#',
        'Propriedade',
        'Plantio',
        'Ano Agrícola',
        'Cultura',
        'Cultivar',
        'Lavoura',
        `Sementes/${getMetricUnity()}`,
        `População/${getMetricUnity()}`,
        '% de emergência',
        '',
    ]
    const style = `0.2fr 1.2fr 0.7fr 0.5fr 0.5fr 0.8fr 1.2fr repeat(2, 0.7fr) 1fr 0.01fr`

    const { admin } = useAdmin()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    let pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

    const { data, isLoading } = useSWR(`/api/reports/list/${admin.id}/data-seeds${currentQuery}${pageParam}`, getFetch)

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        setActivePage(1)
        pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

        const url = `/api/reports/list/${admin.id}/data-seeds${currentQuery}${pageParam}`
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
        <GeralTable
            headers={headers}
            gridColumns={style}
            customClasses={[tableStyles.reportTable, tableStyles.clickableRow]}>
            {data && data.reports ? (
                data.reports.map((item: any, index: number) => (
                    <TableRow
                        key={`parent-${item.id}-${index}`}
                        gridColumns={style}
                        title='Clique para ir para a página detalhes da lavoura'
                        href={`/dashboard/propriedades/lavoura/${item?.property_crop?.id}`}>
                        {/* <div>
                                    <IconifyIcon icon='lucide:chevron-down' />
                                </div> */}
                        <div data-type='content'>
                            <p>{activePage > 1 ? getNumber(index, activePage) : index + 1}</p>
                        </div>
                        <div data-type='content'>
                            <p title={item.property_crop?.property?.name}>{item.property_crop?.property?.name}</p>
                        </div>
                        <div data-type='content'>
                            <p title={formatDateToDDMMYYYY(item.date)}>{formatDateToDDMMYYYY(item.date)}</p>
                        </div>
                        <div data-type='content'>
                            <p>
                                {item.property_crop.is_subharvest
                                    ? item.property_crop.subharvest_name
                                    : (item.property_crop?.harvest?.name ?? '--')}
                            </p>
                        </div>
                        <div data-type='content'>
                            <p title={item.product?.name}>{item.product?.name}</p>
                        </div>
                        <div data-type='content'>
                            <p title={item.product_variant}>{item.product_variant}</p>
                        </div>
                        <div data-type='content'>
                            <p
                                title='Clique para ir para a página detalhes da lavoura'
                                className={tableStyles.linkWrap}>
                                {item.property_crop?.crop?.name}
                            </p>
                        </div>
                        <div data-type='content'>
                            {item.data_population[0]
                                ? formatNumberToBR(item.data_population[0].quantity_per_ha).split(',')[0]
                                : '--'}
                        </div>
                        <div data-type='content'>
                            {item.data_population[0]
                                ? formatNumberToBR(item.data_population[0].plants_per_hectare).split(',')[0]
                                : '--'}
                        </div>
                        <div data-type='content'>
                            {item.data_population[0] ? Math.round(item.data_population[0].emergency_percentage) : '--'}
                        </div>
                    </TableRow>
                ))
            ) : (
                <p>Nenhum dado encontrado</p>
            )}

            <TablePagination alignLeft={true} pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />
        </GeralTable>
    )
}
