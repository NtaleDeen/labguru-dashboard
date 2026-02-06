import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: number;
  username: string;
  role: string;
  client_id?: number;
  exp: number;
}

export class AuthService {
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  }

  static getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }

  static getRole(): string | null {
    const user = this.getUser();
    return user?.role || null;
  }

  static hasRole(requiredRoles: string[]): boolean {
    const userRole = this.getRole();
    if (!userRole) return false;
    
    return requiredRoles.includes(userRole);
  }

  static canAccess(page: string): boolean {
    const userRole = this.getRole();
    if (!userRole) return false;

    const accessRules: Record<string, string[]> = {
      // Admin can access everything
      admin: ['dashboard', 'revenue', 'tests', 'numbers', 'tat', 'reception', 'progress', 'lrids', 'performance', 'tracker', 'meta', 'admin'],
      // Manager can access charts and tables but not admin panel
      manager: ['dashboard', 'revenue', 'tests', 'numbers', 'tat', 'reception', 'progress', 'lrids', 'performance', 'tracker', 'meta'],
      // Technician can only access tables
      technician: ['dashboard', 'reception', 'progress', 'lrids', 'performance', 'tracker', 'meta'],
      // Viewer can only see LRIDS
      viewer: ['dashboard', 'lrids'],
    };

    return accessRules[userRole]?.includes(page) || false;
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}