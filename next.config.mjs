import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    swcMinify: true,
    images: {
        domains: ['127.0.0.1', 'localhost', 'fitoagricola-s3.s3.sa-east-1.amazonaws.com', 'img.youtube.com'],
    },
    sassOptions: {
        includePaths: ['./src'],
        prependData: `@import "~@styles/variables.scss";`,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    devIndicators: {
        buildActivity: true,
        buildActivityPosition: 'bottom-right',
    },
    publicRuntimeConfig: {
        modifiedDate: new Date().toISOString(),
    },
    serverRuntimeConfig: {
        modifiedDate: new Date().toISOString(),
    },
    experimental: {
        serverMinification: false,
        optimizeServerReact: true,
        // swcTraceProfiling: true,
        webpackBuildWorker: true,
        optimizePackageImports: [
            '@fancyapps/ui',
            '@radix-ui',
            'nodemailer',
            '@ckeditor',
            'sortablejs',
            '@iconify/react',
            'iconsax-react',
            '@googlemaps/google-maps-services-js',
            '@react-google-maps/api',
        ],

        useLightningcss: true,
        cssChunking: 'loose', // default
    },
    async rewrites() {
        return [
            // Usuários
            {
                source: '/dashboard/usuarios',
                destination: '/dashboard/users',
            },
            {
                source: '/dashboard/usuarios/:id',
                destination: '/dashboard/users/:id',
            },
            {
                source: '/recuperar-senha/:hash',
                destination: '/recover-password/:hash',
            },

            // Propriedades
            {
                source: '/dashboard/propriedades',
                destination: '/dashboard/properties',
            },
            {
                source: '/dashboard/propriedades/:property_id',
                destination: '/dashboard/properties/:property_id',
            },

            {
                source: '/dashboard/propriedades/lavoura/:property_crop_join_id',
                destination: '/dashboard/properties/crop/:property_crop_join_id',
            },

            {
                source: '/dashboard/propriedades/monitoramento/:property_crops_join_id/:date',
                destination: '/dashboard/properties/monitoring_details/:property_crops_join_id/:date',
            },

            {
                source: '/dashboard/busca',
                destination: '/dashboard/search',
            },

            {
                source: '/dashboard/exportar-graficos/:property_crop_join_id',
                destination: '/dashboard/properties/export-graphs/:property_crop_join_id',
            },
            {
                source: '/webview-graph/:property_crop_join_id',
                destination: '/dashboard/properties/webview-graph/:property_crop_join_id',
            },

            // Bens
            {
                source: '/dashboard/bens',
                destination: '/dashboard/assets',
            },

            // Insumos
            {
                source: '/dashboard/insumos',
                destination: '/dashboard/inputs',
            },

            // Fatores de interferência
            {
                source: '/dashboard/fatores-de-interferencia',
                destination: '/dashboard/interference-factor-items',
            },

            // Lavouras
            {
                source: '/dashboard/lavouras',
                destination: '/dashboard/crops',
            },
            {
                source: '/dashboard/lavoura',
                destination: '/dashboard/crops/form',
            },

            {
                source: '/dashboard/solos',
                destination: '/dashboard/crops-grounds',
            },

            // Safras
            {
                source: '/dashboard/safras',
                destination: '/dashboard/harvests',
            },

            // Produtos
            {
                source: '/dashboard/produtos',
                destination: '/dashboard/products',
            },

            // Estoques
            {
                source: '/dashboard/estoques',
                destination: '/dashboard/stocks',
            },

            // Relatórios
            {
                source: '/dashboard/relatorios',
                destination: '/dashboard/reports',
            },

            // Conteudos
            {
                source: '/dashboard/conteudos',
                destination: '/dashboard/contents',
            },

            // Conteudos
            {
                source: '/dashboard/conteudos-ma',
                destination: '/dashboard/contents',
            },

            // Conteudos -> Adicionar
            {
                source: '/dashboard/conteudos/adicionar',
                destination: '/dashboard/contents/add',
            },
            {
                source: '/dashboard/conteudos/adicionar-ma',
                destination: '/dashboard/contents/add',
            },

            // Conteudos -> Editar
            {
                source: '/dashboard/conteudos/editar/:url',
                destination: '/dashboard/contents/edit/:url',
            },
            {
                source: '/dashboard/conteudos/editar-ma/:url',
                destination: '/dashboard/contents/edit/:url',
            },

            // Conteudos -> Visualizar
            {
                source: '/dashboard/conteudo/:admin_id/:url',
                destination: '/dashboard/contents/:admin_id/:url',
            },

            // Dados pessoais
            {
                source: '/dashboard/dados-pessoais',
                destination: '/dashboard/personal-data',
            },

            // Configurações
            {
                source: '/dashboard/configuracoes',
                destination: '/dashboard/settings',
            },

            // Termos de uso e política de privacidade
            {
                source: '/termos-de-uso',
                destination: '/terms',
            },
            {
                source: '/politica-de-privacidade',
                destination: '/privacy',
            },
            // Timeline
            {
                source: '/dashboard/linha-do-tempo',
                destination: '/dashboard/timeline',
            },
            // Financeiro
            {
                source: '/dashboard/financeiro/gestao',
                destination: '/dashboard/financial/management',
            },
            {
                source: '/dashboard/financeiro/gestao/pessoa/:id',
                destination: '/dashboard/financial/management/people/:id',
            },
            {
                source: '/dashboard/financeiro/gestao/fornecedor/:id',
                destination: '/dashboard/financial/management/suppliers/:id',
            },
            {
                source: '/dashboard/financeiro/gestao/conta/:id',
                destination: '/dashboard/financial/management/accounts/:id',
            },
            {
                source: '/dashboard/financeiro/gestao/cliente/:id',
                destination: '/dashboard/financial/management/clients/:id',
            },
            {
                source: '/dashboard/financeiro/gestao/banco/:id',
                destination: '/dashboard/financial/management/banks/:id',
            },
        ]
    },
    webpack: (config) => {
        config.resolve.fallback = {
            'aws-crt': false,
            encoding: false,
            '@aws-sdk/signature-v4-crt': false,
            bufferutil: false,
            'utf-8-validate': false,
        }

        return config
    },
}

export default withBundleAnalyzer(nextConfig)
