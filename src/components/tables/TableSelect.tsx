import React, { MouseEvent, SelectHTMLAttributes, useState } from 'react'
import styles from './styles.module.scss'
import { TableSelectOptionProps } from './TableSelectOption'

import useOutsideClick from '@/hooks/useOutsideClick'

interface TableSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: TableSelectOptionProps[]
    itemId?: number
    children?: React.ReactNode
    disabled?: boolean
    customOptionClass?: string
}

const TableSelect: React.FC<TableSelectProps> = ({
    defaultValue,
    name,
    options,
    itemId,
    onChange,
    disabled,
    customOptionClass = '',
}) => {
    const [toggleOptions, setToggleOptions] = useState(false)

    const selectedLabel = options.find((option) => option.value == defaultValue)?.label

    const ref = useOutsideClick(() => {
        setToggleOptions(false)
    }, 'exceptionOutside')

    const mirrorSelect = (event: MouseEvent<HTMLDivElement>) => {
        const value = event.currentTarget.getAttribute('data-value')
        const id = itemId
        if (value) {
            const fakeChangeEvent = {
                target: { value, name, id },
            } as unknown as React.ChangeEvent<HTMLSelectElement>

            onChange?.(fakeChangeEvent)
        }
    }

    return (
        <div className={styles.tableSelectWrapper} data-disabled={disabled}>
            <div className={`${styles.tableSelect}`}>
                <div
                    ref={ref}
                    className={`${styles.selected} ${toggleOptions ? styles.show : ''}`}
                    onClick={() => {
                        setToggleOptions(!toggleOptions)
                    }}>
                    {selectedLabel}
                </div>
                <div
                    className={`${styles.options} ${toggleOptions ? styles.show : ''} ${
                        customOptionClass ? styles[customOptionClass] : ''
                    }`}>
                    {options.map((option: TableSelectOptionProps) => (
                        <div
                            onClick={mirrorSelect}
                            key={option.label}
                            className={`exceptionOutside ${styles.option} ${
                                option.value == defaultValue ? styles.selected : ''
                            }`}
                            data-value={option.value}>
                            {option.label}
                        </div>
                    ))}
                </div>
            </div>

            <select name={name} hidden data-id={itemId} onChange={onChange} defaultValue={defaultValue}>
                {options.map((option: TableSelectOptionProps) => (
                    <option key={option.label} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

TableSelect.displayName = 'TableSelect'

export default TableSelect
