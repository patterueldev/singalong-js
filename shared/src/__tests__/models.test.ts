import { UserRole } from '../models';

describe('UserRole', () => {
  describe('enum values', () => {
    it('should have ADMIN role with value "admin"', () => {
      expect(UserRole.ADMIN).toBe('admin');
    });

    it('should have USER role with value "user"', () => {
      expect(UserRole.USER).toBe('user');
    });

    it('should only have two roles', () => {
      const roles = Object.values(UserRole);
      expect(roles).toHaveLength(2);
      expect(roles).toContain('admin');
      expect(roles).toContain('user');
    });
  });

  describe('enum keys', () => {
    it('should have ADMIN and USER keys', () => {
      const keys = Object.keys(UserRole).filter(key => isNaN(Number(key)));
      expect(keys).toHaveLength(2);
      expect(keys).toContain('ADMIN');
      expect(keys).toContain('USER');
    });
  });

  describe('type safety', () => {
    it('should allow assignment of valid role values', () => {
      const adminRole = UserRole.ADMIN;
      const userRole = UserRole.USER;
      
      expect(adminRole).toBe('admin');
      expect(userRole).toBe('user');
    });

    it('should be usable in comparisons', () => {
      const adminRole = UserRole.ADMIN;
      const userRole = UserRole.USER;
      
      expect(adminRole === UserRole.ADMIN).toBe(true);
      expect(userRole === UserRole.USER).toBe(true);
      expect(adminRole === 'admin').toBe(true);
      expect(userRole === 'user').toBe(true);
    });
  });
});
