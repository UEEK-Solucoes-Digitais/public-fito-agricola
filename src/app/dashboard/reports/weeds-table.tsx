import LevelTarget from '@/components/elements/LevelTarget'
import GeralTable from '@/components/tables/GeralTable'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import tableStyles from '@/components/tables/styles.module.scss'
import { useAdmin } from '@/context/AdminContext'
import { formatDateToDDMMYYYY, getNumber } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { FC, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import Loading from '../loading'
import { ReportTableProps } from './types.d'

export const WeedsTable: FC<ReportTableProps> = ({ currentQuery, setUrl }) => {
    const headers = [
        '#',
        'Propriedade',
        'Ano Agrícola',
        'Plantio',
        'Cultura',
        'Cultivar',
        'Lavoura',
        'Data',
        'Daninha',
        'Nível de risco',
        'Observações',
        'Estádio',
        'Responsável',
        '',
    ]
    const style = `0.1fr 1.2fr 0.5fr 0.8fr 0.5fr  repeat(4, 1fr) 1.2fr repeat(3, 1.2fr) 0.01fr`

    const { admin } = useAdmin()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    let pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

    const { data, isLoading } = useSWR(`/api/reports/list/${admin.id}/weeds${currentQuery}${pageParam}`, getFetch)

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        setActivePage(1)
        pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

        const url = `/api/reports/list/${admin.id}/weeds${currentQuery}${pageParam}`
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
            width='1900px'
            headers={headers}
            gridColumns={style}
            customClasses={[tableStyles.reportTable, tableStyles.clickableRow]}>
            {data && data.reports ? (
                data.reports.map((item: any, index: number) => (
                    <TableRow
                        key={item?.property_crop?.id ?? index + 1}
                        gridColumns={style}
                        href={`/dashboard/propriedades/lavoura/${item?.property_crop?.id}`}>
                        <div data-type='content'>
                            <p>{activePage > 1 ? getNumber(index, activePage) : index + 1}</p>
                        </div>
                        <div data-type='content'>
                            <p title={item.property_crop?.property?.name}>
                                {item.property_crop?.property?.name ?? '--'}
                            </p>
                        </div>

                        <div data-type='content'>
                            <p>
                                {item.property_crop.is_subharvest
                                    ? item.property_crop.subharvest_name
                                    : (item.property_crop?.harvest?.name ?? '--')}
                            </p>
                        </div>

                        <div data-type='content'>
                            <p>
                                {item.property_crop?.data_seed && item.property_crop?.data_seed[0]
                                    ? formatDateToDDMMYYYY(item.property_crop?.data_seed[0]?.date)
                                    : '--'}
                            </p>
                        </div>

                        <div data-type='content'>
                            <div
                                title={item.property_crop?.culture_table.replaceAll('<br>', '')}
                                dangerouslySetInnerHTML={{ __html: item.property_crop?.culture_table }}></div>
                        </div>

                        <div data-type='content'>
                            <div
                                title={item.property_crop?.culture_code_table.replaceAll('<br>', '')}
                                dangerouslySetInnerHTML={{ __html: item.property_crop?.culture_code_table }}></div>
                        </div>

                        <div data-type='content'>
                            <p title={item.property_crop?.crop?.name}>{item.property_crop?.crop?.name ?? '--'}</p>
                        </div>

                        <div data-type='content'>
                            <p title={item.open_date}>{item.open_date ? formatDateToDDMMYYYY(item.open_date) : '--'}</p>
                        </div>

                        <div data-type='content'>
                            <p title={item.weed?.name}>{item.weed?.name ?? '--'}</p>
                        </div>

                        <div data-type='content'>
                            <LevelTarget defaultLevel={true} color={item.risk} />
                        </div>

                        <div data-type='content'>
                            <p title={item.weed?.observations}>{item.weed?.observations ?? '--'}</p>
                        </div>

                        <div data-type='content'>
                            <p title={item.property_crop?.stage_table}>{item.property_crop?.stage_table}</p>
                        </div>

                        <div data-type='content'>
                            <p title={item.admin?.name}>{item.admin?.name}</p>
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
