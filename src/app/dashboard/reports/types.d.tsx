import { Dispatch, SetStateAction } from 'react'

export interface ReportTableProps {
    currentQuery: string
    setUrl: Dispatch<SetStateAction<string>>
    ref?: any
}
