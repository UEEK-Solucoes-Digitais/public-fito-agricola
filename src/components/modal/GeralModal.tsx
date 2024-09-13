import IconifyIcon from '@/components/iconify/IconifyIcon'
import React, { HTMLAttributes, Suspense } from 'react'
import GeralBox from '../box/GeralBox'
import GeralButton from '../buttons/GeralButton'
import ElementSkeleton from '../loading/ElementSkeleton'
import styles from './styles.module.scss'

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
    show: boolean
    setShow?: (show: boolean) => void
    small?: boolean
    title?: string
    isDelete?: boolean
    deleteText?: string
    deleteName?: string
    deleteButtonText?: string
    close?: boolean
    deleteFunction?: () => void
    loading?: boolean
    children?: React.ReactNode
    extraButton?: React.ReactNode
    customClasses?: string[]
}

export default function GeralModal({
    close = true,
    isDelete,
    deleteName,
    extraButton,
    deleteText = `Esta é uma ação irreversível. Você está certo de que deseja excluir ${deleteName}?`,
    deleteButtonText = 'Sim, excluir',
    deleteFunction,
    small,
    show = false,
    setShow,
    title,
    loading = false,
    children,
    customClasses,
}: ModalProps) {
    const closeModal = () => {
        if (!loading && setShow) {
            setShow(false)
        }
    }

    if (!show) return

    return (
        <div
            className={`${styles.geralModalWrapper} ${show ? styles.show : ''} ${small ? styles.small : ''} ${
                customClasses ? customClasses?.join(' ') : ''
            }`}
            data-modal>
            <GeralBox small customClasses={[styles.modalBox, show ? styles.show : '']}>
                <Suspense fallback={<ElementSkeleton />}>
                    <div className={styles.modalHeader}>
                        <h5>{title}</h5>

                        <div className={styles.headerAction}>
                            {extraButton}
                            {close && (
                                <GeralButton smallIcon variant='noStyle' onClick={closeModal} disabled={loading}>
                                    <IconifyIcon icon='ph:x' />
                                </GeralButton>
                            )}
                        </div>
                    </div>

                    <div className={styles.modalBody}>
                        {isDelete ? (
                            <div className={styles.deleteUserModal}>
                                <p>{deleteText}</p>

                                <div className={styles.actions}>
                                    <GeralButton
                                        variant='secondary'
                                        type='button'
                                        small
                                        value={deleteButtonText}
                                        disabled={loading}
                                        onClick={deleteFunction}
                                    />

                                    <GeralButton
                                        variant='quaternary'
                                        type='button'
                                        small
                                        value='Cancelar'
                                        disabled={loading}
                                        onClick={closeModal}
                                    />
                                </div>
                            </div>
                        ) : (
                            children
                        )}
                    </div>
                </Suspense>
            </GeralBox>
        </div>
    )
}
