'use client'
import { CultureExport } from '@/components/graphs-export/CultureExport'
import { useAdmin } from '@/context/AdminContext'
import { FC } from 'react'
import { ReportTableProps } from './types.d'

export const CultureTab: FC<ReportTableProps> = ({ currentQuery }) => {
    const { admin } = useAdmin()

    return <CultureExport query={`/api/reports/list/${admin.id}/cultures${currentQuery}`} />
}
