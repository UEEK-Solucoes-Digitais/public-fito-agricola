import React, { HTMLAttributes } from 'react'
import styles from './styles.module.scss'

interface TableActionsProps extends HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode
}

const TableActions: React.FC<TableActionsProps> = ({ children }) => {
    return <div className={styles.tableActions}>{children}</div>
}

TableActions.displayName = 'TableActions'

export default TableActions
