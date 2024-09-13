import React, { OptionHTMLAttributes } from 'react'
import styles from './styles.module.scss'

export interface TableSelectOptionProps extends OptionHTMLAttributes<HTMLOptionElement> {
    children?: React.ReactNode
}

export const TableSelectOption: React.FC<TableSelectOptionProps> = ({ value, label }) => {
    return (
        <div className={`${styles.tableSelectOption}`} data-value={value}>
            {label}
        </div>
    )
}
