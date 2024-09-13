'use client'

import IconifyIcon from '@/components/iconify/IconifyIcon'
import React, { HTMLAttributes, MouseEvent, useState } from 'react'
import GeralButton from '../buttons/GeralButton'
import GeralModal from '../modal/GeralModal'
import styles from './styles.module.scss'

interface TableHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title: string
    filter?: boolean
    titleIcon?: string
    iconSvg?: JSX.Element | undefined
    description?: string
    noBottom?: boolean
    children?: React.ReactNode
    buttonActionName?: string
    noButton?: boolean
    secondButtonActionName?: string
    thirdButtonActionName?: string
    onButtonAction?: (event: MouseEvent<HTMLButtonElement>) => void
    onSecondButtonAction?: (event: MouseEvent<HTMLButtonElement>) => void
    onThirdButtonAction?: (event: MouseEvent<HTMLButtonElement>) => void
    onFilterButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

const TableHeader: React.FC<TableHeaderProps> = ({
    title,
    titleIcon,
    iconSvg,
    description,
    noBottom = false,
    filter = false,
    buttonActionName,
    secondButtonActionName,
    thirdButtonActionName,
    onButtonAction,
    onFilterButtonClick,
    onSecondButtonAction,
    onThirdButtonAction,
    noButton = false,
    children,
}) => {
    const [toggleFilter, setToggleFilter] = useState(false)

    const [openActionModal, setActionModal] = useState(false)

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0

    return (
        <>
            <div className={`${styles.tableTopWrapper} ${noBottom ? 'mb-0' : ''}`}>
                <div className={`${styles.tableTop} ${buttonActionName ? styles.center : ''}`}>
                    <div className={styles.tableText}>
                        <div className={styles.titleFlex}>
                            <div className={styles.titleWrapper}>
                                {iconSvg && iconSvg}
                                {!iconSvg && <IconifyIcon icon={titleIcon ?? 'lucide:box'} />}
                                <h2>{title}</h2>
                            </div>

                            <div className={styles.buttons}>
                                {thirdButtonActionName && (
                                    <GeralButton
                                        variant='primaryInline'
                                        type='button'
                                        onClick={onThirdButtonAction}
                                        small>
                                        {thirdButtonActionName}
                                    </GeralButton>
                                )}
                                {secondButtonActionName && (
                                    <GeralButton
                                        variant='primaryInline'
                                        type='button'
                                        onClick={onSecondButtonAction}
                                        small>
                                        {secondButtonActionName}
                                    </GeralButton>
                                )}
                                {buttonActionName && (
                                    <GeralButton
                                        variant={
                                            buttonActionName.includes('Adicionar') ||
                                            buttonActionName.includes('Registrar')
                                                ? 'primary'
                                                : 'primaryInline'
                                        }
                                        type='button'
                                        onClick={onButtonAction}
                                        small>
                                        {buttonActionName}
                                    </GeralButton>
                                )}

                                {secondButtonActionName || thirdButtonActionName ? (
                                    <GeralButton
                                        customClasses={[styles.mobileActions]}
                                        round
                                        type='button'
                                        small
                                        onClick={() => setActionModal(!openActionModal)}>
                                        <IconifyIcon icon='ri:more-fill' />
                                    </GeralButton>
                                ) : null}

                                {filter && (
                                    <GeralButton
                                        customClasses={[styles.filterButton]}
                                        disabled={toggleFilter}
                                        variant='tertiary'
                                        onClick={() => {
                                            setToggleFilter(true)
                                        }}
                                        small
                                        smallIcon>
                                        <IconifyIcon icon='lucide:sliders' />
                                        Filtros
                                    </GeralButton>
                                )}
                            </div>
                        </div>

                        {/* {buttonActionName && description && <p title={description}>{description}</p>}
                        {!buttonActionName && <p title={description}>{description}</p>} */}
                        <p title={description}>{description}</p>
                    </div>
                </div>

                {filter && (
                    <div className={`${styles.filterWrapper} ${toggleFilter ? styles.toggle : ''}`}>
                        <span>Filtros</span>

                        <div className={styles.formFields}>
                            <div className={styles.fields}>{children}</div>
                            {!noButton && (
                                <GeralButton
                                    small={true}
                                    variant='primary'
                                    value='Filtrar'
                                    type='submit'
                                    onClick={onFilterButtonClick}
                                />
                            )}
                        </div>

                        <GeralButton
                            smallIcon={true}
                            variant='noStyle'
                            onClick={() => {
                                setToggleFilter(false)
                            }}>
                            <IconifyIcon icon='ph:x' />
                        </GeralButton>
                    </div>
                )}
            </div>

            {openActionModal && (
                <GeralModal title='Ações' show={openActionModal} setShow={setActionModal}>
                    <div className={styles.modalContent}>
                        {thirdButtonActionName && (
                            <GeralButton
                                customClasses={['toFill']}
                                variant='primaryInline'
                                type='button'
                                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                    onThirdButtonAction ? onThirdButtonAction(event) : null
                                    setActionModal(false)
                                }}
                                small>
                                {thirdButtonActionName}
                            </GeralButton>
                        )}
                        {secondButtonActionName && (
                            <GeralButton
                                customClasses={['toFill']}
                                variant='primaryInline'
                                type='button'
                                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                    onSecondButtonAction ? onSecondButtonAction(event) : null
                                    setActionModal(false)
                                }}
                                small>
                                {secondButtonActionName}
                            </GeralButton>
                        )}
                        {buttonActionName && (
                            <GeralButton
                                customClasses={['toFill']}
                                variant={buttonActionName.includes('Adicionar') ? 'primary' : 'primaryInline'}
                                type='button'
                                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                    onButtonAction ? onButtonAction(event) : null
                                    setActionModal(false)
                                }}
                                small>
                                {buttonActionName}
                            </GeralButton>
                        )}
                    </div>
                </GeralModal>
            )}

            {screenWidth <= 1200 && (
                <GeralModal show={toggleFilter} setShow={setToggleFilter} title='Filtros'>
                    <div className={styles.modalContent}>{children}</div>
                    {!noButton && (
                        <div style={{ marginTop: '20px' }}>
                            <GeralButton
                                small={true}
                                variant='primary'
                                value='Filtrar'
                                type='submit'
                                customClasses={['toFill']}
                                onClick={onFilterButtonClick}
                            />
                        </div>
                    )}
                </GeralModal>
            )}
        </>
    )
}

TableHeader.displayName = 'TableHeader'

export default TableHeader
