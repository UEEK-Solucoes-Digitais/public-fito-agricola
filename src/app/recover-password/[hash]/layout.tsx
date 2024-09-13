import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Recuperar Senha - Fito Agrícola',
    description:
        'A Fito Agrícola é um sistema de gerenciamento inovador para agricultores. Otimize suas lavouras e propriedades com ferramentas de controle de solo, clima e produção. Torne a agricultura mais eficaz e sustentável com Fito Agrícola hoje!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
