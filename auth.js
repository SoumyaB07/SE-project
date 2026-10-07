// Academic Portal Management System - Authentication & Session Management

const AUTH_KEY = 'APMS_CURRENT_USER';

const Auth = {
  getCurrentUser() {
    const u = sessionStorage.getItem(AUTH_KEY);
    return u ? JSON.parse(u) : null;
  },

  setCurrentUser(user) {
    if (user) {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_KEY);
    }
  },

  login(credential, password) {
    if (!credential || !password) {
      return { success: false, message: 'Please enter both your Username/ID and password.' };
    }

    const cleanTerm = credential.trim().toLowerCase();
    const users = DB.get('users');

    // Flexible identifier matching:
    // Matches username, facultyId, rollNo, email, or formatted "FAC-id"
    const user = users.find(u => {
      const matchUsername = u.username && u.username.toLowerCase() === cleanTerm;
      const matchFacultyId = u.facultyId && u.facultyId.toLowerCase() === cleanTerm;
      const matchRollNo = u.rollNo && u.rollNo.toLowerCase() === cleanTerm;
      const matchEmail = u.email && u.email.toLowerCase() === cleanTerm;
      const matchFormattedFacId = (u.role === 'faculty' && (`fac-${u.id}` === cleanTerm || `fac00${u.id}` === cleanTerm));

      const isMatch = matchUsername || matchFacultyId || matchRollNo || matchEmail || matchFormattedFacId;
      return isMatch && (String(u.password) === String(password).trim());
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid login credentials! You can log in using your Faculty ID, Username, or Email (Default password: 123).'
      };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  },

  quickLogin(username) {
    const users = DB.get('users');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      this.setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false, message: 'Demo user not found' };
  },

  logout() {
    this.setCurrentUser(null);
    window.location.reload();
  }
};
