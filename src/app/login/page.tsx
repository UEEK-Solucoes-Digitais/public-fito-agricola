'use client'

import ForgotPasswordForm from '@/components/login/ForgotPasswordForm'
import LoginForm from '@/components/login/LoginForm'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import fitoBrand from '../../../public/brand/new-logo.png'
import loginBackgroundMobile from '../../../public/images/login-bg-mobile.png'
import loginBackground from '../../../public/images/login-bg.png'
import loginImage from '../../../public/images/login-image.png'
import styles from './styles.module.scss'

export default function Login() {
    const searchParams = useSearchParams()
    const [forgotPassword, setForgotPassword] = useState(!!searchParams.get('recuperar-senha'))

    return (
        <div className={styles.pageContainer}>
            <Image src={fitoBrand} alt='' loading='lazy' className={styles.brand} />
            <Image
                src={loginBackground}
                alt=''
                loading='lazy'
                className={`${styles.backgroundImage} ${styles.backgroundImageDesktop}`}
            />
            <Image
                src={loginBackgroundMobile}
                alt=''
                loading='lazy'
                className={`${styles.backgroundImage} ${styles.backgroundImageMobile}`}
            />
            <div className={styles.imageWrapper}>
                <Image src={loginImage} alt='' priority />
            </div>

            {!forgotPassword ? (
                <LoginForm customClasses={[styles.formPosition]} onForgotPassword={() => setForgotPassword(true)} />
            ) : (
                <ForgotPasswordForm
                    customClasses={[styles.formPosition]}
                    onLoginForm={() => setForgotPassword(false)}
                    showLink={!searchParams.get('recuperar-senha')}
                />
            )}
        </div>
    )
}
