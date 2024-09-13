'use client'

import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import useDebounce from '@/hooks/useDebounce'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { type HTMLAttributes, type MouseEvent, useEffect, useState } from 'react'
import GeralButton from '../buttons/GeralButton'
import IconifyIcon from '../iconify/IconifyIcon'
import GeralInput from '../inputs/GeralInput'
import Sidebar from '../sidebar'

import ContentCategoryProps from '@/@types/ContentCategory'
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

const HelloHeader: React.FC<PageHeaderProps> = ({
    buttonValue,
    buttonHref,
    placeholder,
    onButtonClick,
    disabledFunctions = false,
    showOptions = true,
    listForFilter,
}) => {
    const { admin } = useAdmin()
    const [openSearch, setOpenSearch] = useState(false)
    const [search, setSearch] = useState('')
    const [sidebarActive, setSidebarActive] = useState(false)
    const pathname = usePathname()
    const { setSearchPage } = useSearch()
    const debouncedSearch = useDebounce(search, search.length == 0 ? 100 : 1000)

    useEffect(() => {
        setSearchPage(debouncedSearch)
    }, [debouncedSearch, setSearchPage])

    const isContent = pathname.includes('/dashboard/conteudo')
    const isContentList = pathname == '/dashboard/conteudos' || pathname == '/dashboard/conteudos-ma'

    if (!isContentList) {
        disabledFunctions = true
    }

    let lists

    if (listForFilter && listForFilter.categories) {
        lists = [
            {
                title: 'Categorias',
                itens: [
                    {
                        id: 0,
                        name: 'Todas as categorias',
                    },
                    ...listForFilter.categories.map((item: ContentCategoryProps) => {
                        return {
                            id: item.id,
                            name: item.name,
                        }
                    }),
                ],
            },
        ]
    }

    return (
        <>
            <div
                className={clsx(styles.pageHeader, {
                    [styles.darkSchema]: isContent,
                })}>
                <div className={styles.nameWrap}>Olá, {admin.name}</div>

                <div className={styles.actions}>
                    {showOptions && (
                        <>
                            {!disabledFunctions && (
                                <>
                                    {placeholder && (
                                        <>
                                            <div className={clsx(styles.searchDesktop, styles.searchArea)}>
                                                <GeralInput
                                                    variant='secondary'
                                                    placeholder={placeholder}
                                                    name='header_search'
                                                    type='text'
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        setSearch(e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div className={styles.searchMobile}>
                                                <GeralButton
                                                    round
                                                    variant='gray'
                                                    type='button'
                                                    onClick={() => setOpenSearch((state) => !state)}>
                                                    <IconifyIcon icon='iconoir:search' />
                                                </GeralButton>

                                                <div
                                                    className={`${styles.searchWrap} ${openSearch ? styles.open : ''}`}>
                                                    <GeralInput
                                                        variant='secondary'
                                                        placeholder={placeholder}
                                                        name='header_search_mobile'
                                                        defaultValue={search}
                                                        type='text'
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                            setSearch(e.target.value)
                                                        }
                                                    />

                                                    <GeralButton
                                                        round
                                                        variant='gray'
                                                        type='button'
                                                        onClick={() => {
                                                            setSearch('')
                                                            setOpenSearch((state) => !state)
                                                        }}>
                                                        <IconifyIcon icon='lucide:x' />
                                                    </GeralButton>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className={styles.buttonToSearch}>
                                        <GeralButton
                                            round
                                            variant='gray'
                                            type='button'
                                            onClick={() => setOpenSearch(!openSearch)}>
                                            Filtrar
                                        </GeralButton>
                                    </div>
                                </>
                            )}

                            {/* <div className={styles.roundWrapper}>
                            <GeralButton round variant='gray' type='button'>
                                <IconifyIcon icon='iconoir:bell' />
                            </GeralButton>
                        </div> */}

                            {buttonValue && !buttonHref && (
                                <>
                                    <GeralButton
                                        variant='secondary'
                                        type='button'
                                        value={buttonValue}
                                        onClick={onButtonClick}
                                        disabled={disabledFunctions}
                                        customClasses={[styles.buttonDesktop]}
                                    />
                                    <GeralButton
                                        variant='secondary'
                                        type='button'
                                        onClick={onButtonClick}
                                        disabled={disabledFunctions}
                                        customClasses={[styles.buttonMobile]}>
                                        <IconifyIcon icon='ph:plus' />
                                    </GeralButton>
                                </>
                            )}

                            {buttonValue && buttonHref && (
                                <>
                                    <GeralButton
                                        href={buttonHref}
                                        variant='secondary'
                                        value={buttonValue}
                                        disabled={disabledFunctions}
                                        customClasses={[styles.buttonDesktop]}
                                    />
                                    <GeralButton
                                        href={buttonHref}
                                        variant='secondary'
                                        value='+'
                                        disabled={disabledFunctions}
                                        customClasses={[styles.buttonMobile]}
                                    />
                                </>
                            )}

                            <button
                                type='button'
                                className={styles.buttonMenu}
                                onClick={() => {
                                    setSidebarActive(true)
                                }}>
                                <span />
                                <span />
                                <span />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {openSearch && <Sidebar lists={lists} onClose={() => setOpenSearch(false)} />}
        </>
    )
}

export default HelloHeader
