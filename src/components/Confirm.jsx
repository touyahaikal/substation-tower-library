import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from './ui.jsx'
import { useStore } from '../lib/store.jsx'

// In-app replacement for window.confirm(): rendered once in App, opened with ask() from the store
export function ConfirmHost() {
  const { confirmReq, answerConfirm } = useStore()
  if (!confirmReq) return null
  return (
    <Modal
      title={confirmReq.title || 'Are you sure?'}
      onClose={() => answerConfirm(false)}
      footer={
        <>
          <button className="btn" onClick={() => answerConfirm(false)}>Cancel</button>
          <button className={`btn ${confirmReq.danger ? '!bg-red-600 !border-red-600 !text-white' : 'btn-primary'}`} onClick={() => answerConfirm(true)} autoFocus>
            {confirmReq.confirmLabel || 'Confirm'}
          </button>
        </>
      }
    >
      <p className="text-sm">{confirmReq.message}</p>
    </Modal>
  )
}

// Inline "Confirm Delete? [Yes, Delete] [Cancel]" bar that replaces the trash button in place
export function DeleteButton({ onConfirm, label, className = 'btn btn-ghost !p-1.5', prompt = 'Confirm Delete?' }) {
  const [armed, setArmed] = useState(false)
  if (!armed) {
    return (
      <button className={className} onClick={(e) => { e.stopPropagation(); setArmed(true) }} aria-label="Delete" title="Delete">
        <Trash2 size={15} />{label && <span className="ml-1">{label}</span>}
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap text-xs border border-red-500/50 bg-red-500/10 px-2 py-1 rounded" onClick={(e) => e.stopPropagation()}>
      <b className="text-red-500">{prompt}</b>
      <button className="btn !py-0.5 !px-2 text-xs !bg-red-600 !border-red-600 !text-white" onClick={() => { setArmed(false); onConfirm() }}>Yes, Delete</button>
      <button className="btn !py-0.5 !px-2 text-xs" onClick={() => setArmed(false)}>Cancel</button>
    </span>
  )
}
