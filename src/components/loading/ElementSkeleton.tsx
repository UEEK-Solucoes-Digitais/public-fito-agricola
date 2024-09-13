import React from 'react'

import IconifyIcon from '../iconify/IconifyIcon'
import styles from './styles.module.scss'

const ElementSkeleton: React.FC<{ center?: boolean }> = ({ center = false }) => {
    return (
        <div className={`${styles.elementWrapper} ${center ? styles.center : ''}`}>
            <IconifyIcon icon='line-md:loading-loop' />
        </div>
    )
}

ElementSkeleton.displayName = 'ElementSkeleton'

export default ElementSkeleton
