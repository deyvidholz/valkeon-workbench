import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { DialogActions, DialogHeader, eyebrow, inputStyle } from './parts'

export function NameDialog() {
  const { t } = useTranslation()
  const open = useStore((s) => s.nameDialogOpen)
  const userName = useStore((s) => s.userName)
  const setUserName = useStore((s) => s.setUserName)
  const close = useStore((s) => s.closeNameDialog)
  const [name, setName] = useState(userName)

  useEffect(() => {
    if (open) setName(userName)
  }, [open, userName])

  if (!open) return null
  const save = (): void => {
    if (name.trim()) setUserName(name)
  }

  return (
    <Modal onClose={close} width={440} zIndex={58} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="account_circle" title={userName ? t('nameDialog.title', 'Your name') : t('nameDialog.welcome', 'Welcome to Valkeon')} subtitle={t('nameDialog.subtitle', 'What should we call you? It’s shown in the sidebar.')} />
      <div style={eyebrow}>NAME</div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
        }}
        placeholder={t('nameDialog.placeholder', 'e.g. Jordan')}
        style={{ ...inputStyle, marginBottom: 18 }}
        autoFocus
      />
      <DialogActions onCancel={close} onConfirm={save} confirmLabel={t('nameDialog.save', 'Save')} confirmIcon="check" />
    </Modal>
  )
}
