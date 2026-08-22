import { config } from '@onecms/eslint-config/react-internal'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  ...config,
  {
    plugins: {
      'react-refresh': reactRefresh
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ]
    }
  }
]
