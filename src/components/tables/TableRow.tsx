import { useRouter } from 'nextjs-toploader/app'
import React, { HTMLAttributes } from 'react'
import styles from './styles.module.scss'

export interface TableRowProps extends HTMLAttributes<HTMLDivElement> {
    editing?: boolean
    gridColumns?: string
    columnsCount?: number
    children?: React.ReactNode
    emptyString?: string
    href?: string
    customClasses?: string[]
}

const TableRow: React.FC<TableRowProps> = ({
    columnsCount,
    gridColumns,
    emptyString,
    href,
    children,
    customClasses = [],
}) => {
    const router = useRouter()

    const inline = {
        gridTemplateColumns: gridColumns || `repeat(${columnsCount}, 1fr)`,
    }

    return href ? (
        <div
            className={`${styles.tableRow} ${emptyString ? styles.empty : ''} ${customClasses.join(' ')}`}
            // type='button'
            onClick={() => {
                router.push(href)
            }}
            style={inline}>
            {emptyString && <span>{emptyString}</span>}
            {children}
        </div>
    ) : (
        <div
            className={`${styles.tableRow} ${emptyString ? styles.empty : ''} ${customClasses.join(' ')}`}
            style={inline}>
            {emptyString && <span>{emptyString}</span>}
            {children}
        </div>
    )
}

TableRow.displayName = 'TableRow'

export default TableRow
