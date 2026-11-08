import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WineDetailPage from '@/pages/WineDetailPage';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'Sommelier Coleccionista', role: 'User' },
  }),
}));

describe('WineDetailPage Snapshot Previo', () => {
  it('renderiza la plantilla con el vino editorial catena-zapata-malbec-argentino de forma idéntica', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/vinos/catena-zapata-malbec-argentino']}>
        <Routes>
          <Route path="/vinos/:id" element={<WineDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(container).toMatchSnapshot();
  });
});
