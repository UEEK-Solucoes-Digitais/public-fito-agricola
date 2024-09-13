'use client'

import GeralBox from '@/components/box/GeralBox'
import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'
import { useNotification } from '@/context/ToastContext'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import { motion } from 'framer-motion'
import React, { ChangeEvent, FormEvent, useState } from 'react'
import styles from './styles.module.scss'

interface FormData {
    email: string
}

interface FormProps {
    onLoginForm?: () => void
    customClasses?: string[]
    showLink: boolean
}

const ForgotPasswordForm: React.FC<FormProps> = ({ customClasses, onLoginForm, showLink }) => {
    const { setToast } = useNotification()
    const [formData, setFormData] = useState<FormData>({ email: '' })
    const [loading, setLoading] = useState(false)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (!loading) {
                setLoading(true)
                setToast({ text: 'Enviando email de recuperação', state: 'loading' })

                await axios.post('/api/user/request-recover', formData)

                setToast({ text: 'Email enviado com sucesso', state: 'success' })

                setTimeout(() => {
                    onLoginForm && onLoginForm()
                }, 1000)
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className={`${customClasses?.join(' ')} ${styles.defaultWrap}`}>
                <GeralBox customClasses={[styles.formBox, styles.formForgotPasswordBox]}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ ease: 'easeIn' }}
                        className={styles.textWrapper}>
                        <div className={styles.infoWrapper}>
                            <span>Fito Agrícola</span>
                            <h1>Recuperar senha</h1>
                            <p>
                                Digite abaixo o seu e-mail, se ele estiver em nosso banco de dados entraremos em contato
                                com instruções sobre a sua recuperação de senha.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <GeralInput
                                variant='login'
                                placeholder='- Digite aqui - '
                                name='email'
                                type='email'
                                label='Email'
                                onChange={handleChange}
                                required
                            />

                            <div className={styles.buttonWrapper}>
                                {showLink && (
                                    <GeralButton
                                        value='Voltar para o login'
                                        type='button'
                                        variant='inline'
                                        customClasses={[styles.inlineButton]}
                                        onClick={onLoginForm}
                                    />
                                )}

                                <GeralButton
                                    value='Enviar'
                                    type='submit'
                                    loading={loading}
                                    customClasses={['toFill', styles.fillButton]}
                                />
                            </div>
                        </form>
                    </motion.div>
                </GeralBox>
                {/* <p className={styles.mobileText}>Desenvolvido por<br/>José de Alencar</p> */}
            </div>
        </>
    )
}

ForgotPasswordForm.displayName = 'Forgot Password'

export default ForgotPasswordForm
