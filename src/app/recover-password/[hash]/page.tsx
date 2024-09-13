'use client'

import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useRouter } from 'nextjs-toploader/app'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import useSWRImmutable from 'swr'
import styles from './styles.module.scss'

interface FormData {
    id: number
    password: string
    confirmPassword: string
}

export default function Page({ params }: { params: { hash: string } }) {
    const { setToast } = useNotification()
    const router = useRouter()
    const [formData, setFormData] = useState<FormData>({ id: 0, password: '', confirmPassword: '' })
    const [notMatch, setNotMatch] = useState(false)
    const { data, error, isLoading } = useSWRImmutable(`/api/user/read-recover/${params.hash}`, getFetch)

    const recoverPassword = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (!notMatch) {
                setToast({ text: 'Realizando alteração', state: 'loading' })

                axios.post('/api/user/recover', formData)

                setToast({ text: 'Senha alterada com sucesso', state: 'success' })

                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            } else {
                setToast({ text: 'As senhas devem ser iguais', state: 'danger' })

                setTimeout(() => {
                    setToast({ text: '', state: null })
                }, 2000)
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    useEffect(() => {
        if (formData.password !== formData.confirmPassword) {
            setNotMatch(true)
        } else {
            setNotMatch(false)
        }
    }, [formData])

    useEffect(() => {
        if (data && !isLoading && !error) {
            setFormData({
                id: data.admin.id,
                password: '',
                confirmPassword: '',
            })
        }
    }, [data, isLoading, error])

    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <ElementSkeleton />
    }

    return (
        <GeralModal show={true} close={false} title='Recuperar senha'>
            <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease: 'easeIn' }}
                className={styles.recoverPasswordForm}
                onSubmit={recoverPassword}>
                <span>Preencha sua nova senha abaixo</span>

                <GeralInput
                    variant='secondary'
                    label='Senha'
                    name='password'
                    type='password'
                    placeholder='Digite senha'
                    onChange={handleUserInputChange}
                />

                <GeralInput
                    variant='secondary'
                    customClasses={[`${notMatch ? styles.notMatch : ''}`]}
                    label='Confirma sua senha'
                    name='confirmPassword'
                    type='password'
                    placeholder='Digite senha'
                    onChange={handleUserInputChange}
                />

                <div className={styles.actions}>
                    <GeralButton variant='secondary' type='submit' small value='Enviar' />
                </div>
            </motion.form>
        </GeralModal>
    )
}
