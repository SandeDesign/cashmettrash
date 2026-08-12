import React from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';

interface InspectionStatusBadgeProps {
  status: 'voeg_fotos_toe' | 'in_behandeling' | 'goedgekeurd' | 'afgekeurd';
  size?: 'sm' | 'md' | 'lg';
}

export default function InspectionStatusBadge({ status, size = 'md' }: InspectionStatusBadgeProps) {
  const statusConfig = {
    voeg_fotos_toe: {
      icon: Upload,
      label: 'Voeg Foto\'s toe',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
    },
    in_behandeling: {
      icon: Clock,
      label: 'In Behandeling',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
    },
    goedgekeurd: {
      icon: CheckCircle,
      label: 'Goedgekeurd',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
    },
    afgekeurd: {
      icon: XCircle,
      label: 'Afgekeurd',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      <Icon className={`${iconSizes[size]} ${config.iconColor}`} />
      {config.label}
    </span>
  );
}
