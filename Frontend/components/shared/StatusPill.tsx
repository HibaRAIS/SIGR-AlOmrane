'use client';

import { cn } from '@/lib/utils';

type StatusType =
  | 'OK' | 'FAIBLE' | 'CRITIQUE' | 'RUPTURE'
  | 'EN_ATTENTE' | 'VALIDEE' | 'EN_PREPARATION' | 'LIVREE' | 'ANNULEE' | 'REJETEE'
  | 'RECU_PARTIEL' | 'SOLDE' | 'ANNULE'
  | 'BROUILLON' | 'EN_COURS' | 'VALIDE'
  | 'ENTREE' | 'SORTIE' | 'AJUSTEMENT'
  | 'NORMAL' | 'URGENT'
  | 'SURVEILLANCE';

const statusConfig: Record<StatusType, { bg: string; text: string; border: string; dot: string; label: string; pulse?: boolean }> = {
  OK: { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7', dot: '#2E7D32', label: 'Normal' },
  FAIBLE: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', dot: '#E65100', label: 'Faible' },
  CRITIQUE: { bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A', dot: '#EF5350', label: 'Critique', pulse: true },
  RUPTURE: { bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A', dot: '#EF5350', label: 'Rupture', pulse: true },
  SURVEILLANCE: { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082', dot: '#F9A825', label: 'Surveillance' },

  EN_ATTENTE: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', dot: '#1976D2', label: 'En attente' },
  VALIDEE: { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7', dot: '#2E7D32', label: 'Validée' },
  EN_PREPARATION: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', dot: '#1976D2', label: 'En préparation' },
  LIVREE: { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8', dot: '#8E24AA', label: 'Livrée' },
  ANNULEE: { bg: '#F5F5F5', text: '#616161', border: '#BDBDBD', dot: '#9E9E9E', label: 'Annulée' },
  REJETEE: { bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A', dot: '#EF5350', label: 'Rejetée' },

  RECU_PARTIEL: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', dot: '#E65100', label: 'Reçu partiel' },
  SOLDE: { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8', dot: '#8E24AA', label: 'Soldée' },
  ANNULE: { bg: '#F5F5F5', text: '#616161', border: '#BDBDBD', dot: '#9E9E9E', label: 'Annulé' },

  BROUILLON: { bg: '#F5F5F5', text: '#616161', border: '#BDBDBD', dot: '#9E9E9E', label: 'Brouillon' },
  EN_COURS: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', dot: '#1976D2', label: 'En cours' },
  VALIDE: { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7', dot: '#2E7D32', label: 'Validé' },

  ENTREE: { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7', dot: '#2E7D32', label: 'Entrée' },
  SORTIE: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', dot: '#E65100', label: 'Sortie' },
  AJUSTEMENT: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', dot: '#1976D2', label: 'Ajustement' },

  NORMAL: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', dot: '#1976D2', label: 'Normal' },
  URGENT: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', dot: '#E65100', label: 'Urgent' },
};

interface StatusPillProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export function StatusPill({ status, size = 'md', showDot = true }: StatusPillProps) {
  const config = statusConfig[status as StatusType] || {
    bg: '#F5F5F5', text: '#616161', border: '#BDBDBD', dot: '#9E9E9E', label: status
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
      style={{ backgroundColor: config.bg, color: config.text, borderColor: config.border }}
    >
      {showDot && (
        <span
          className={cn('rounded-full flex-shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', config.pulse && 'pulse-dot')}
          style={{ backgroundColor: config.dot }}
        />
      )}
      {config.label}
    </span>
  );
}