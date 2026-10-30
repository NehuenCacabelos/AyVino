import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge, { ActiveBadge } from '@/features/admin/components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renderiza correctamente el estado Approved como Aprobada', () => {
    render(<StatusBadge status="Approved" />);
    expect(screen.getByText('Aprobada')).toBeInTheDocument();
  });

  it('renderiza correctamente el estado Rejected como Rechazada', () => {
    render(<StatusBadge status="Rejected" />);
    expect(screen.getByText('Rechazada')).toBeInTheDocument();
  });

  it('renderiza correctamente el estado Pending como Pendiente', () => {
    render(<StatusBadge status="Pending" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renderiza ActiveBadge como Activo cuando isActive es true', () => {
    render(<ActiveBadge isActive={true} />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('renderiza ActiveBadge como Bloqueado cuando isActive es false', () => {
    render(<ActiveBadge isActive={false} />);
    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
  });
});
