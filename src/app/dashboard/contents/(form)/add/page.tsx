'use client'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import styles from '../styles.module.scss'

const Form = dynamic(() => import('../form'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

export default function Page() {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <div className={styles.wrapper}>
            <button
                onClick={() => {
                    router.push(`/dashboard/conteudos${pathname.includes('adicionar-ma') ? '-ma' : ''}`)
                }}
                className={styles.backButton}>
                <IconifyIcon icon='bi:arrow-left' className={styles.icon} />
                <h1 className={styles.title} title='Adicionar conteúdo' aria-label='Adicionar conteúdo'>
                    Adicionar conteúdo
                </h1>
            </button>

            <Form />
        </div>
    )
}
