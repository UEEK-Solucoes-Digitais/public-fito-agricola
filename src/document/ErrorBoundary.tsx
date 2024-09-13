import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryState {
    hasError: boolean
}

interface ErrorBoundaryProps {
    children: ReactNode
    fallbackComponent?: ReactNode
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (process.env.NEXT_PUBLIC_SHOW_LOG_ERROR) {
            console.group('Error Boundary:')
            console.error('Message:', error)
            console.error('Info:', errorInfo)
            console.groupEnd()
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallbackComponent || <h1>Algo deu errado.</h1>
        }

        return this.props.children
    }
}

export default ErrorBoundary

// TODO: Tratar todos os erros
