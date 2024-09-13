import { useAddButton } from '@/context/AddButtonContext'
import { useEffect } from 'react'

// Hook personalizado que aceita uma função de ação
const useSetupAddButton = (actionFunction: any) => {
    const { setActionAddButton } = useAddButton()

    useEffect(() => {
        // Define a ação do botão quando o componente é montado
        setActionAddButton(() => actionFunction)

        // Limpa a ação do botão quando o componente é desmontado
        return () => setActionAddButton(null)
    }, [actionFunction, setActionAddButton])
}

export default useSetupAddButton
