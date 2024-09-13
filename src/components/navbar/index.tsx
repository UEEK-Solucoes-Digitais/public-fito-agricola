'use client'

import { useEffect, useState } from 'react'

import { ContentIcon } from '@/assets/icons/Icons'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import { AccessConsts } from '@/consts/AccessConsts'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useSidebarContext } from '@/context/SidebarContext'
import { useTab } from '@/context/TabContext'
import { useNotification } from '@/context/ToastContext'
import useOutsideClick from '@/hooks/useOutsideClick'
import WriteLog from '@/utils/logger'
import { Icon } from '@iconify/react/dist/iconify.js'
import Cookies from 'js-cookie'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import fitoBrand from '../../../public/brand/new-logo.png'
import sidbarBrand from '../../../public/brand/sidebar-logo.svg'
import userProfile from '../../../public/images/default-profile.jpg'
import styles from './styles.module.scss'

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const { selectedTab, setSelectedTab } = useTab()
    const levels = !admin ? [] : admin.level.toString().split(',')
    const { setCategoryPage, setSearchPage } = useSearch()

    const [dropdownInterference, setDropdownInterference] = useState(false)
    const [dropdownFinancial, setDropdownFinancial] = useState(false)
    const [toggleProfileMenu, setToggleProfileMenu] = useState(false)
    const { sidebarActive, setSidebarActive } = useSidebarContext()

    const ref = useOutsideClick(() => {
        setToggleProfileMenu(false)
    }, 'exceptionOutside')

    const logoutAdmin = () => {
        try {
            Cookies.remove('fito_auth_token')
            Cookies.remove('fito_auth_expire')
            setToast({ text: `Deslogado com sucesso`, state: 'success' })

            setTimeout(() => {
                router.push('/login')
            }, 1000)
        } catch (error: any) {
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            WriteLog(error, 'error')
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (
            !pathname.includes('exportar-graficos') &&
            !pathname.includes('webview-graph') &&
            admin &&
            (admin.is_super_user == null || admin.currency_id == null || admin.access_ma == null)
        ) {
            setToast({
                text: `Uma atualização foi feita no sistema, é necessário fazer o login novamente.`,
                state: 'info',
            })

            Cookies.remove('fito_auth_token')
            Cookies.remove('fito_auth_expire')

            setTimeout(() => {
                router.push('/login')
            }, 3000)
        }
    }, [admin])

    const expandDropdownInterference = () => {
        setDropdownInterference((state) => !state)
    }

    useEffect(() => {
        if (selectedTab && selectedTab.includes(':')) {
            const tab = selectedTab.split(':')[1]

            if (selectedTab.includes('interference:')) {
                setDropdownInterference(true)
            } else if (selectedTab.includes('input:')) {
                setDropdownInterference(false)
            }

            if (typeof window !== 'undefined') {
                window.history.pushState({ filter: true }, selectedTab, `${pathname}?tab=${tab}`)
            }
        }
    }, [selectedTab])

    useEffect(() => {
        if (
            !pathname.includes('fatores-de-interferencia') &&
            !pathname.includes('insumos') &&
            !pathname.includes('relatorios') &&
            !pathname.includes('propriedades/lavoura')
        ) {
            setDropdownInterference(false)
            setSelectedTab(null)
        }
    }, [pathname])

    return (
        <>
            {!pathname.includes('exportar-graficos') && !pathname.includes('webview-graph') && (
                <aside className={`${styles.asideMenu} ${sidebarActive ? styles.active : ''}`}>
                    <div className={styles.navWrapper}>
                        <div className={styles.navLogo}>
                            <Link href='/dashboard'>
                                <Image
                                    src={fitoBrand}
                                    className={styles.openLogo}
                                    height={50}
                                    width={126}
                                    alt='Logo Fito Agrícola'
                                    priority
                                />
                                <Image
                                    src={sidbarBrand}
                                    className={styles.collapseLogo}
                                    height={50}
                                    width={126}
                                    alt='Logo Fito Agrícola'
                                    priority
                                />
                            </Link>

                            <button
                                type='button'
                                className={styles.buttonMenu}
                                onClick={() => {
                                    setSidebarActive(false)
                                }}>
                                <IconifyIcon icon='lucide:x' />
                            </button>
                        </div>

                        <ul className={styles.menuItens}>
                            <li>
                                <Link
                                    href='/dashboard'
                                    className={`${styles.menuLink} ${pathname == '/dashboard' ? styles.active : ''}`}
                                    onClick={() => {
                                        setSidebarActive(false)
                                    }}>
                                    <IconifyIcon icon='solar:home-2-linear' />
                                    <span>Início</span>
                                </Link>
                            </li>

                            <li style={{ all: 'unset' }}>
                                <hr className={styles.divider}></hr>
                            </li>

                            {levels.includes(AccessConsts.REPORTS) && (
                                <li>
                                    <Link
                                        href='/dashboard/relatorios?tab=geral'
                                        className={`${styles.menuLink} ${
                                            pathname.includes('relatorios') ? styles.active : ''
                                        }`}
                                        onClick={() => {
                                            setSidebarActive(false)
                                        }}>
                                        <IconifyIcon icon='ph:chart-pie-slice' />
                                        <span>Relatórios</span>
                                    </Link>
                                </li>
                            )}

                            <li className={`${styles.dropdownLi} ${dropdownInterference ? styles.opened : ''}`}>
                                <div
                                    className={`${styles.menuLink} ${styles.withDropdown} ${
                                        pathname.includes('/dashboard/conteudos') ? `${styles.active}` : ''
                                    } ${dropdownInterference ? styles.opened : ''}`}
                                    onClick={expandDropdownInterference}>
                                    <div className={styles.dropdownInfo}>
                                        <ContentIcon />
                                        <span>Conteúdos</span>
                                        <IconifyIcon icon='ph:caret-down' />
                                    </div>

                                    <div className={`${styles.dropdownMenu}`}>
                                        {levels.includes(AccessConsts.CONTENTS) && (
                                            <Link
                                                onClick={() => {
                                                    setCategoryPage(0)
                                                    setSearchPage('')
                                                }}
                                                href={'/dashboard/conteudos'}
                                                className={`${styles.menuLink} ${pathname.includes('/dashboard/conteudos') && !pathname.includes('/dashboard/conteudos-ma') ? styles.active : ''}`}>
                                                <ContentIcon />
                                                Cursos
                                            </Link>
                                        )}

                                        <Link
                                            onClick={() => {
                                                setCategoryPage(0)
                                                setSearchPage('')
                                            }}
                                            href={'/dashboard/conteudos-ma'}
                                            className={`${styles.menuLink} ${pathname.includes('/dashboard/conteudos-ma') ? styles.active : ''}`}>
                                            <IconifyIcon icon='ph:seal-check' />
                                            M.A
                                        </Link>
                                    </div>
                                </div>
                            </li>

                            {levels.includes(AccessConsts.PROPERTIES) && (
                                <li>
                                    <Link
                                        href='/dashboard/propriedades'
                                        className={`${styles.menuLink} ${
                                            pathname.includes('propriedades') ? styles.active : ''
                                        }`}
                                        onClick={() => {
                                            setSidebarActive(false)
                                        }}>
                                        <IconifyIcon icon='material-symbols:circle-outline' />
                                        <span>Propriedades</span>
                                    </Link>
                                </li>
                            )}

                            <li>
                                <Link
                                    href='https://wa.me/+555497009322?text=Olá, necessito de auxílio com o Fito App.'
                                    className={`${styles.menuLink}`}
                                    target='_blank'>
                                    <IconifyIcon icon='ic:baseline-whatsapp' />
                                    <span>Suporte</span>
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href='/dashboard/configuracoes'
                                    className={`${styles.menuLink} ${
                                        pathname.includes('configuracoes') ? styles.active : ''
                                    }`}
                                    onClick={() => {
                                        setSidebarActive(false)
                                    }}>
                                    <IconifyIcon icon='lucide:settings' />
                                    <span>Configurações</span>
                                </Link>
                            </li>

                            {admin.access_level == 1 && (
                                <li>
                                    <Link
                                        href='/dashboard/linha-do-tempo'
                                        className={`${styles.menuLink} ${
                                            pathname.includes('linha-do-tempo') ? styles.active : ''
                                        }`}
                                        onClick={() => {
                                            setSidebarActive(false)
                                        }}>
                                        <IconifyIcon icon='ph:git-commit-bold' />
                                        <span>Linha do tempo</span>
                                    </Link>
                                </li>
                            )}

                            <li className={`${styles.dropdownLi} ${dropdownFinancial ? styles.opened : ''}`}>
                                <div
                                    className={`${styles.menuLink} ${styles.withDropdown} ${
                                        pathname.includes('/dashboard/financeiro') ? `${styles.active}` : ''
                                    } ${dropdownFinancial ? styles.opened : ''}`}
                                    onClick={() => setDropdownFinancial(!dropdownFinancial)}>
                                    <div className={styles.dropdownInfo}>
                                        <Icon icon='bx:dollar' />
                                        <span>Financeiro</span>
                                        <IconifyIcon icon='ph:caret-down' />
                                    </div>

                                    <div className={`${styles.dropdownMenu}`}>
                                        <Link
                                            onClick={() => {
                                                setCategoryPage(0)
                                            }}
                                            href={'/dashboard/financeiro/gestao'}
                                            className={`${styles.menuLink} ${pathname.includes('/dashboard/financeiro/gestao') ? styles.active : ''}`}>
                                            <Icon icon='ph:gear' />
                                            Gestão
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        </ul>

                        <div className={styles.profileWrapper}>
                            {admin && (
                                <>
                                    <button
                                        ref={ref}
                                        className={styles.userProfile}
                                        type='button'
                                        onClick={() => setToggleProfileMenu(!toggleProfileMenu)}>
                                        <Image
                                            src={
                                                admin.profile_picture
                                                    ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/admins/${admin.profile_picture}`
                                                    : userProfile
                                            }
                                            height={38}
                                            width={38}
                                            alt='Foto de perfil'
                                            priority
                                        />
                                        {admin?.name}
                                    </button>

                                    {toggleProfileMenu && (
                                        <div
                                            className={`${styles.profileOptions} ${
                                                toggleProfileMenu ? styles.show : ''
                                            }`}>
                                            <GeralButton
                                                variant='inline'
                                                value='Perfil'
                                                customClasses={['exceptionOutside']}
                                                // href={`/dashboard/dados-pessoais`}
                                                onClick={() => {
                                                    setSidebarActive(false)
                                                    router.push(`/dashboard/usuarios/${admin?.id}`)
                                                }}
                                            />
                                            <GeralButton
                                                variant='inline'
                                                value='Sair'
                                                customClasses={['exceptionOutside']}
                                                onClick={() => {
                                                    logoutAdmin()
                                                    setSidebarActive(false)
                                                }}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            <div
                className={`${styles.mobileWarning}
                ${pathname.includes('exportar-graficos') || pathname.includes('webview-graph') ? styles.dontShow : ''}`}>
                <p>Para uma melhor experiência, utilize o aplicativo Fito Agrícola.</p>

                <div className={styles.links}>
                    <Link
                        href='https://play.google.com/store/apps/details?id=com.fitoagricola.app&pli=1'
                        target='_blank'>
                        <Image src='/images/google-play.png' width={100} height={50} alt='Google Play' loading='lazy' />
                    </Link>

                    <Link href='https://apps.apple.com/br/app/fito-agr%C3%ADcola/id6503173424' target='_blank'>
                        <Image src='/images/app-store.png' alt='App Store' width={100} height={50} loading='lazy' />
                    </Link>
                </div>
            </div>
        </>
    )
}
