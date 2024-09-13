import IconifyIcon from '@/components/iconify/IconifyIcon'
import React from 'react'
import styles from './dashboard/styles.module.scss'

const Loading: React.FC = () => {
    return (
        <div className={styles.loadingPage}>
            <IconifyIcon icon='line-md:loading-loop' />
        </div>
    )
}

export default Loading
