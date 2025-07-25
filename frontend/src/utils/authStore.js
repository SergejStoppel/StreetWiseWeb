// Simple auth store to share auth state between AuthContext and API
class AuthStore {
  constructor() {
    this.currentSession = null;
    this.listeners = [];
  }

  setSession(session) {
    this.currentSession = session;
    this.notifyListeners();
  }

  getSession() {
    return this.currentSession;
  }

  clearSession() {
    this.currentSession = null;
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentSession));
  }
}

export const authStore = new AuthStore();