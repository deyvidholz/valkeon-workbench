import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc'
import type { SkillSave } from '@shared/skills'
import type { GlobalStore } from '../persistence/globalStore'
import { assertAllowedRepo } from '../security'
import { listSkills, saveSkill, setSkillEnabled } from './reader'

export function registerSkillsIpc(globalStore: GlobalStore): void {
  ipcMain.handle(IpcChannels.skillsList, (_e, repoPath: string) =>
    listSkills(assertAllowedRepo(globalStore, repoPath))
  )
  ipcMain.handle(IpcChannels.skillsSave, (_e, repoPath: string, save: SkillSave) =>
    saveSkill(assertAllowedRepo(globalStore, repoPath), save)
  )
  ipcMain.handle(IpcChannels.skillsSetEnabled, (_e, repoPath: string, id: string, enabled: boolean) =>
    setSkillEnabled(assertAllowedRepo(globalStore, repoPath), id, enabled)
  )
}
