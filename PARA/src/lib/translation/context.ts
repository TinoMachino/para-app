import * as React from 'react'

import {type ContextType} from './types'

export const Context = React.createContext<ContextType | null>(null)
Context.displayName = 'TranslationContext'
