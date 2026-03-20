import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ConfirmDialogContext = React.createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = (config) => {
    return new Promise((resolve) => {
      setState({
        ...config,
        isOpen: true,
        onConfirm: () => {
          resolve(true);
          setState(null);
        },
        onCancel: () => {
          resolve(false);
          setState(null);
        },
      });
    });
  };

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {state && (
        <ConfirmDialog
          isOpen={state.isOpen}
          title={state.title}
          description={state.description}
          confirmText={state.confirmText || 'Confirm'}
          cancelText={state.cancelText || 'Cancel'}
          confirmVariant={state.confirmVariant || 'destructive'}
          onConfirm={state.onConfirm}
          onCancel={state.onCancel}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = React.useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
}

function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  confirmVariant,
  onConfirm,
  onCancel,
}) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={confirmVariant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
