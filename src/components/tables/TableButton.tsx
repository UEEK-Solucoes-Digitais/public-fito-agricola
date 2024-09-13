import React, { ButtonHTMLAttributes } from 'react'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import styles from './styles.module.scss'
import Link from 'next/link'

type TableButtonVariant = 'see' | 'edit' | 'delete' | 'confirm' | 'info' | 'history' | 'calendar' | 'user' | 'map'

interface TableButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string
    variant: TableButtonVariant
    title?: string
}

const GetIcon = ({ variant = '' }) => {
    switch (variant) {
        case 'see':
            return <IconifyIcon icon='ph:eye' />
        case 'info':
            return <IconifyIcon icon='material-symbols:info-outline' />
        case 'history':
            return <IconifyIcon icon='octicon:history-24' />
        case 'edit':
            return <IconifyIcon icon='ph:pencil-simple' />
        case 'delete':
            return <IconifyIcon icon='ph:trash' />
        case 'confirm':
            return <IconifyIcon icon='iconamoon:check-bold' />
        case 'calendar':
            return <IconifyIcon icon='material-symbols:edit-calendar-outline' />
        case 'user':
            return <IconifyIcon icon='ph:user' />
        case 'map':
            return <IconifyIcon icon='uiw:map' />
        default:
            return ''
    }
}

const TableButton: React.FC<TableButtonProps> = ({ type = 'button', variant, href, onClick, title }) => {
    return (
        <>
            {href && (
                <Link href={href} className={`${styles.tableButton} ${styles[variant]}`} title={title}>
                    <GetIcon variant={variant} />
                </Link>
            )}

            {!href && (
                <button
                    type={type}
                    className={`${styles.tableButton} ${styles[variant]}`}
                    onClick={onClick}
                    title={title}>
                    <GetIcon variant={variant} />
                </button>
            )}
        </>
    )
}

TableButton.displayName = 'TableButton'

export default TableButton
