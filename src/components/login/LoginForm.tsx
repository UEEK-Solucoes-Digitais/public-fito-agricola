'use client'

import GeralBox from '@/components/box/GeralBox'
import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import getDate from '@/utils/getDate'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import { motion } from 'framer-motion'
import Cookies from 'js-cookie'
import { useRouter } from 'nextjs-toploader/app'
import React, { ChangeEvent, FormEvent, useState } from 'react'
import styles from './styles.module.scss'

interface FormData {
    email: string
    password: string
}

interface FormProps {
    customClasses?: string[]
    onForgotPassword?: () => void
}

const LoginForm: React.FC<FormProps> = ({ customClasses, onForgotPassword }) => {
    const { setToast } = useNotification()
    const [formData, setFormData] = useState<FormData>({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const { setAdmin } = useAdmin()
    const router = useRouter()

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (!loading) {
                setLoading(true)
                setToast({ text: 'Realizando autenticação', state: 'loading' })

                const response = await axios.post('/api/user/login', formData)

                const { admin, token, expires_in } = response.data
                const expiresIn = getDate(expires_in)
                Cookies.set('fito_auth_token', token, { expires: 1 })
                Cookies.set('fito_auth_expire', expiresIn, { expires: 1 })
                setAdmin(admin)

                setToast({ text: 'Autenticado com sucesso', state: 'success' })

                setTimeout(() => {
                    router.push('/dashboard')
                }, 1500)
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            setLoading(false)
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    return (
        <div className={`${customClasses?.join(' ')} ${styles.defaultWrap}`}>
            <GeralBox customClasses={[styles.formBox]}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ease: 'easeIn' }}
                    className={styles.textWrapper}>
                    <div className={styles.infoWrapper}>
                        <span>Fito Agrícola</span>
                        <h1>Bem-vindo</h1>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <GeralInput
                            variant='login'
                            placeholder='- Digite aqui - '
                            name='email'
                            type='email'
                            label='Email'
                            onChange={handleChange}
                            autoComplete='email'
                            tabIndex={1}
                            readOnly={loading}
                            required
                        />

                        <GeralInput
                            variant='login'
                            placeholder='- Digite sua senha - '
                            name='password'
                            type='password'
                            label='Senha'
                            onChange={handleChange}
                            autoComplete='password'
                            tabIndex={2}
                            readOnly={loading}
                            required
                        />

                        <div className={styles.buttonWrapper}>
                            <GeralButton
                                value='Esqueci minha senha'
                                type='button'
                                variant='inline'
                                onClick={onForgotPassword}
                                tabIndex={3}
                                customClasses={[styles.inlineButton]}
                                disabled={loading}
                            />

                            <GeralButton
                                value='Entrar'
                                type='submit'
                                tabIndex={4}
                                disabled={loading}
                                customClasses={['toFill', styles.fillButton]}
                            />
                        </div>
                    </form>
                </motion.div>
            </GeralBox>

            {/* <p className={styles.mobileText}>Desenvolvido por<br/>José de Alencar</p> */}
        </div>
    )
}

export default LoginForm
