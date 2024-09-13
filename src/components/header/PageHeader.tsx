'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import type React from 'react'
import type { HTMLAttributes, MouseEvent } from 'react'
import ElementSkeleton from '../loading/ElementSkeleton'
import styles from './styles.module.scss'

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
    buttonValue?: string
    onButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void
    placeholder?: string
    showOptions?: boolean
    buttonHref?: string
    disabledFunctions?: boolean
    listForFilter?: any
}

const Form = dynamic(() => import('@/components/forms/fixed/Form'), {
    loading: () => <ElementSkeleton />,
})

const HelloHeader = dynamic(() => import('./hello-header'), {
    loading: () => <ElementSkeleton />,
})

const PageHeader: React.FC<PageHeaderProps> = ({
    buttonValue,
    buttonHref,
    placeholder,
    onButtonClick,
    disabledFunctions = false,
    showOptions = true,
    listForFilter,
}) => {
    const pathname = usePathname()

    if (pathname.includes('/dashboard/conteudo')) {
        return (
            <div className={styles.formFixed}>
                <HelloHeader
                    buttonValue={buttonValue}
                    buttonHref={buttonHref}
                    placeholder={placeholder}
                    onButtonClick={onButtonClick}
                    disabledFunctions={disabledFunctions}
                    showOptions={showOptions}
                    listForFilter={listForFilter}
                />
            </div>
        )
    }

    return (
        <div className={styles.formFixed}>
            <Form placeholder={placeholder} disabledFunctions={disabledFunctions} />
        </div>
    )
}

export default PageHeader
