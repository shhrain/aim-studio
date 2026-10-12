import config from '@aim/eslint-config/next'

export default [...config, { ignores: ['.source/**', 'public/typedoc/**'] }]
