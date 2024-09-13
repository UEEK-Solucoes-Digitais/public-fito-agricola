import { ContentIcon, FertilizantesIcon } from '@/assets/icons/Icons'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import { AccessConsts } from '@/consts/AccessConsts'
import { useTab } from '@/context/TabContext'
import { useNotification } from '@/context/ToastContext'
import WriteLog from '@/utils/logger'
import Cookies from 'js-cookie'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import { MouseEvent, useState } from 'react'
import styles from '../../styles.module.scss'

interface IProps {
    open: boolean
    admin: any
    isSidebar?: boolean
    setOpenSidebar?: any
}

const DropdownLinks = ({ open, admin, isSidebar = false, setOpenSidebar }: IProps) => {
    const levels = !admin ? [] : admin.level.toString().split(',')
    const [dropdownInput, setDropdownInput] = useState(false)
    const [dropdownInterference, setDropdownInterference] = useState(false)
    const expandDropdownInterference = () => {
        setDropdownInterference((state) => !state)
    }
    const currentPath = usePathname()
    const { setSelectedTab } = useTab()

    const isCurrentPage = (href: string) => href == currentPath

    const router = useRouter()
    const { setToast } = useNotification()

    const expandDropdownInputs = () => {
        setDropdownInput((state) => !state)
    }

    const handleSetTab = async (
        event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
        checkPath: boolean = false,
    ) => {
        if (!checkPath || (checkPath && currentPath.includes('dashboard/propriedades/lavoura'))) {
            const key = (event.target as HTMLAnchorElement).getAttribute('data-key')
            setSelectedTab(key)
        }
    }

    const logoutAdmin = () => {
        try {
            Cookies.remove('fito_auth_token')
            Cookies.remove('fito_auth_expire')
            setToast({ text: `Deslogado com sucesso`, state: 'success' })

            setTimeout(() => {
                router.push('/login')
            }, 1000)
            // axios.get('/api/user/logout').then(() => {

            //     router.push('/login');
            // });
        } catch (error: any) {
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            WriteLog(error, 'error')
            setToast({ text: message, state: 'danger' })
        }
    }

    const RenderLink = ({
        href,
        tabName,
        tabKey,
        icon,
        iconSvg,
        label,
        customClass,
    }: {
        href: string
        tabName: string
        tabKey: string
        icon?: string
        iconSvg?: any
        label: string
        customClass?: string
    }) => {
        if (isCurrentPage(href)) {
            return (
                <button
                    key={tabKey}
                    data-key={tabKey}
                    onClick={(e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                        handleSetTab(e)

                        if (setOpenSidebar) {
                            setOpenSidebar(false)
                        }
                    }}
                    className={`${styles.menuLink} ${customClass}`}>
                    {icon && <IconifyIcon icon={icon} />}
                    {iconSvg}
                    {label}
                </button>
            )
        } else {
            return (
                <>
                    <Link
                        key={tabKey}
                        data-key={tabKey}
                        href={`${href}${tabName ? '?tab=' + tabName : ''}`}
                        onClick={(e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                            handleSetTab(e)

                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        className={`${styles.menuLink} ${customClass}`}>
                        {icon && <IconifyIcon icon={icon} />}
                        {iconSvg}
                        {label}
                    </Link>
                </>
            )
        }
    }

    return (
        <div className={`${styles.actionDropdown} ${open ? styles.open : ''} ${isSidebar ? styles.sidebar : ''}`}>
            {!isSidebar && <p>Cadastros gerais</p>}

            <div className={styles.actionsLink}>
                {isSidebar && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard'
                        className={`${styles.menuLink}`}>
                        <IconifyIcon icon='solar:home-2-linear' />
                        Início
                    </Link>
                )}

                {!isSidebar && levels.includes(AccessConsts.ADMINS) && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/usuarios'
                        className={`${styles.menuLink}`}>
                        <IconifyIcon icon='ph:user' />
                        Usuários
                    </Link>
                )}

                {isSidebar && levels.includes(AccessConsts.PROPERTIES) && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/propriedades'
                        className={`${styles.menuLink} `}>
                        <IconifyIcon icon='material-symbols:circle-outline' />
                        Propriedades
                    </Link>
                )}

                {!isSidebar && levels.includes(AccessConsts.CROPS) && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/lavouras'
                        className={`${styles.menuLink} `}>
                        <IconifyIcon icon='ph:plant' />
                        Lavouras
                    </Link>
                )}
                {!isSidebar && levels.includes(AccessConsts.STOCKS) && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/estoques'
                        className={`${styles.menuLink} `}>
                        <IconifyIcon icon='ph:warehouse' />
                        Estoque
                    </Link>
                )}

                {!isSidebar && levels.includes(AccessConsts.ASSETS) && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/bens'
                        className={`${styles.menuLink}`}>
                        <IconifyIcon icon='ph:car' />
                        Bens
                    </Link>
                )}

                {!isSidebar && admin.is_super_user == 1 && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/safras'
                        className={`${styles.menuLink} `}>
                        <IconifyIcon icon='ph:circle-half' />
                        Anos Agrícolas
                    </Link>
                )}

                {!isSidebar && levels.includes(AccessConsts.INTERFERENCE_FACTORS) && (
                    <div
                        className={`${styles.menuLink} ${styles.withDropdown}  ${
                            dropdownInterference ? styles.opened : ''
                        }`}
                        onClick={expandDropdownInterference}>
                        <div className={`${styles.dropdownInfo} exceptionOutside`}>
                            <IconifyIcon icon='ph:intersect' />
                            Fatores
                            <br />
                            de Interferência
                            <IconifyIcon icon='ph:caret-down' />
                        </div>

                        <div className={`${styles.dropdownMenu} exceptionOutside`}>
                            <RenderLink
                                customClass='exceptionOutside'
                                href='/dashboard/fatores-de-interferencia'
                                tabName='daninhas'
                                tabKey='interference:daninhas'
                                icon='ph:leaf'
                                label='Daninhas'
                            />

                            <RenderLink
                                customClass='exceptionOutside'
                                href='/dashboard/fatores-de-interferencia'
                                tabName='doencas'
                                tabKey='interference:doencas'
                                icon='ph:first-aid-kit'
                                label='Doenças'
                            />

                            <RenderLink
                                customClass='exceptionOutside'
                                href='/dashboard/fatores-de-interferencia'
                                tabName='pragas'
                                tabKey='interference:pragas'
                                icon='ph:bug-beetle-light'
                                label='Pragas'
                            />
                        </div>
                    </div>
                )}

                {!isSidebar && levels.includes(AccessConsts.INPUTS) && (
                    <div
                        className={`${styles.menuLink} ${styles.withDropdown}  ${dropdownInput ? styles.opened : ''}`}
                        onClick={expandDropdownInputs}>
                        <div className={`${styles.dropdownInfo} exceptionOutside`}>
                            <IconifyIcon icon='ph:package' />
                            Insumos
                            <IconifyIcon icon='ph:caret-down' />
                        </div>

                        <div className={`${styles.dropdownMenu} exceptionOutside`}>
                            <RenderLink
                                customClass='exceptionOutside'
                                href='/dashboard/insumos'
                                tabName='culturas'
                                tabKey='input:culturas'
                                icon='ph:circles-four-light'
                                label='Culturas'
                            />

                            <RenderLink
                                customClass='exceptionOutside'
                                href='/dashboard/insumos'
                                tabName='defensivos'
                                tabKey='input:defensivos'
                                icon='ph:shield-check'
                                label='Defensivos'
                            />

                            <RenderLink
                                customClass='exceptionOutside'
                                href='/dashboard/insumos'
                                tabName='fertilizantes'
                                tabKey='input:fertilizantes'
                                iconSvg={<FertilizantesIcon />}
                                label='Fertilizantes'
                            />
                        </div>
                    </div>
                )}

                {isSidebar && levels.includes(AccessConsts.REPORTS) && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/relatorios?tab=geral'
                        className={`${styles.menuLink} `}>
                        <IconifyIcon icon='ph:chart-pie-slice' />
                        Relatórios
                    </Link>
                )}

                {isSidebar && levels.includes(AccessConsts.CONTENTS) && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/conteudos'
                        className={`${styles.menuLink} `}>
                        <ContentIcon />
                        Conteúdos
                    </Link>
                )}

                {isSidebar && (
                    <Link
                        onClick={() => {
                            if (setOpenSidebar) {
                                setOpenSidebar(false)
                            }
                        }}
                        href='/dashboard/configuracoes'
                        className={`${styles.menuLink} `}>
                        <IconifyIcon icon='lucide:settings' />
                        Configurações
                    </Link>
                )}

                {isSidebar && (
                    <>
                        <button
                            className={`${styles.menuLink} `}
                            onClick={() => {
                                logoutAdmin()
                                setOpenSidebar(false)
                            }}>
                            <IconifyIcon icon='material-symbols:logout' />
                            Sair
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default DropdownLinks
