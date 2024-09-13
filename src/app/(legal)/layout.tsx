import Image from 'next/image'
import { ReactNode } from 'react'
import fitoBrand from '../../../public/brand/new-logo.png'
import styles from './styles.module.scss'

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.scrollDiv}>
            <header className={styles.header}>
                <div className={styles.container}>
                    <Image src={fitoBrand} alt='Fito Agrícola' />
                </div>
            </header>

            <section>
                <div className={`${styles.container} ${styles.textWrap}`}>{children}</div>
            </section>

            <footer className={styles.footer}>
                <div className={styles.container}>
                    <Image src={fitoBrand} alt='Fito Agrícola' />

                    <p>
                        Fito Consultoria Agrícola Ltda. Av. Nívio Castelano, 849 - Centro.
                        <br />
                        Lagoa Vermelha - RS
                    </p>
                </div>
            </footer>
        </div>
    )
}
