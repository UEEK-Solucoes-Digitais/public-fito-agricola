import Link from 'next/link'
import React from 'react'
import IconifyIcon from '../iconify/IconifyIcon'
import styles from './styles.module.scss'

interface LinkProps {
    name: string
    url: string
}

interface BreadcrumbProps {
    links: LinkProps[]
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ links }) => {
    return (
        <nav className={styles.breadCrumb}>
            <IconifyIcon icon='lucide:arrow-left' />

            <ul className={styles.path}>
                {links.length == 0 && <li>...</li>}

                {links.map((link) => (
                    <li key={link.url} className={styles.local}>
                        <Link href={link.url}>{link.name}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

Breadcrumb.displayName = 'Breadcrumb Component'

export default Breadcrumb
