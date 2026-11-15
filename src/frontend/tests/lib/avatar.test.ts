import { describe, it, expect } from 'vitest';
import { getAvatarUrl } from '@/lib/avatar';

describe('getAvatarUrl helper', () => {
  it('returns backend image url with variant=avatar when user has avatarImageId', () => {
    const user = {
      username: 'sommelier_mendoza',
      avatarImageId: '987fcdeb-51a2-43f7-9abc-def012345678',
    };

    const url = getAvatarUrl(user);
    expect(url).toBe('/api/images/987fcdeb-51a2-43f7-9abc-def012345678?variant=avatar');
  });

  it('returns DiceBear Notionists URL with username as seed when user has no avatarImageId or photo', () => {
    const user = {
      username: 'catador_experto',
      avatarImageId: null,
      photo: null,
    };

    const url = getAvatarUrl(user);
    expect(url).toContain('https://api.dicebear.com/7.x/notionists/svg');
    expect(url).toContain('seed=catador_experto');
  });

  it('handles legacy absolute photo URL correctly as fallback', () => {
    const user = {
      username: 'usuario_antiguo',
      photo: 'https://cdn.example.com/legacy_avatar.jpg',
    };

    const url = getAvatarUrl(user);
    expect(url).toBe('https://cdn.example.com/legacy_avatar.jpg');
  });

  it('falls back to default seed AyVino when user is null or undefined', () => {
    const urlNull = getAvatarUrl(null);
    expect(urlNull).toContain('seed=AyVino');

    const urlUndefined = getAvatarUrl(undefined);
    expect(urlUndefined).toContain('seed=AyVino');
  });
});
