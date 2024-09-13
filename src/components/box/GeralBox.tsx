import React, { HTMLAttributes } from 'react'

import styles from './styles.module.scss'

type BoxVariant = 'primary' | 'secondary' | 'tertiary' | 'page' | 'property'

interface BoxProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    small?: boolean
    variant?: BoxVariant
    customClasses?: string[]
}

const GeralBox: React.FC<BoxProps> = ({ variant = '', children, small, customClasses }) => {
    return (
        <div
            className={`${small ? styles.small : ''} ${styles.geralBox} ${variant ? styles[variant] : ''} ${customClasses ? customClasses?.join(' ') : ''}`}>
            {children}
        </div>
    )
}

GeralBox.displayName = 'GeralBox'

export default GeralBox
