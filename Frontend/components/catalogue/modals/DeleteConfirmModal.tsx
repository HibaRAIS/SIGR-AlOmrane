import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DeleteConfirmModal({
  open,
  onOpenChange,
  productName,
  canDelete,
  blockedReason,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productName: string;
  canDelete: boolean;
  blockedReason?: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        className="sm:max-w-sm rounded-xl border border-zinc-200 shadow-xl bg-white p-6 [&>button.absolute]:hidden [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Confirmer la suppression</DialogTitle>
        <DialogHeader className="space-y-2 mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
              canDelete ? 'bg-red-50' : 'bg-amber-50',
            )}
          >
            <Trash2 className={cn('w-5 h-5', canDelete ? 'text-red-500' : 'text-amber-500')} />
          </div>
          <DialogTitle className="text-base font-semibold text-zinc-900">
            {canDelete ? 'Confirmer la suppression' : 'Suppression impossible'}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-zinc-500 space-y-2">
              {canDelete ? (
                <p>
                  Supprimer définitivement{' '}
                  <span className="font-medium text-zinc-800">
                    «&nbsp;{productName}&nbsp;»
                  </span>{' '}
                  ? Cette action est irréversible.
                </p>
              ) : (
                <>
                  <p className="font-semibold text-amber-700">
                    Vous ne pouvez pas supprimer cet article.
                  </p>
                  <p>{blockedReason}</p>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:flex-row flex-col">
          {/* Bouton Annuler / Fermer – toujours lisible grâce aux classes explicites */}
          <Button
            variant="outline"
            className="flex-1 rounded-lg h-9 text-sm font-medium border-zinc-300 text-zinc-800 bg-white hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400 transition-colors"
            onClick={() => onOpenChange(false)}
          >
            {canDelete ? 'Annuler' : 'Fermer'}
          </Button>
          {canDelete && (
            <Button
              className="flex-1 rounded-lg h-9 bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
              onClick={onConfirm}
            >
              Supprimer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}