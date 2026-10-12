import { editorHandlers } from './handlers/editor'
import { experienceHandlers } from './handlers/experience'

export { editorHandlers } from './handlers/editor'
export { abilityOf, experienceHandlers } from './handlers/experience'
export { commit, createSeed, getDb, resetDb, type MockDb, type StoredTemplate } from './db'
export { getControl, setControl, type MockControl } from './utils'
export * from './fixtures'

/** 全部接口 handlers */
export const handlers = [...experienceHandlers, ...editorHandlers]
