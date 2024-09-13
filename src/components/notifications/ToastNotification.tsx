import React from 'react'

import IconifyIcon from '@/components/iconify/IconifyIcon'

import { useNotification } from '@/context/ToastContext'

import styles from './styles.module.scss'

const ToastNotification: React.FC = () => {
    const { toastData, isVisible } = useNotification()

    if (!isVisible || toastData.state == 'hidden' || toastData.text == '') {
        return null
    }

    return (
        <div
            className={`${styles.toastWrapper} ${toastData.state ? styles[toastData.state] : ''} ${styles.visible} ${styles[toastData.position ?? 'bottom']}`}>
            <div className={styles.iconWrapper}>
                {toastData.state == 'loading' && <IconifyIcon icon='line-md:loading-loop' />}

                {toastData.state == 'success' && <IconifyIcon icon='line-md:circle-to-confirm-circle-transition' />}

                {toastData.state == 'info' && <IconifyIcon icon='line-md:alert-circle' />}

                {toastData.state == 'danger' && <IconifyIcon icon='line-md:close-circle' />}

                {toastData.state == 'warning' && <IconifyIcon icon='line-md:alert' />}
            </div>

            {toastData.text}
        </div>
    )
}

ToastNotification.displayName = 'Toast Notification'

export default ToastNotification
