// Academic Portal Management System - Administrator Module

const Admin = {
  render() {
    this.populateDeptDropdowns();
    this.renderStats();
    this.renderDepartments();
    this.renderStudents();
    this.renderFaculty();
    this.renderCourses();
    this.renderNotices();
  },

  populateDeptDropdowns() {
    const depts = DB.get('departments');
    const optionsHtml = depts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');

    ['new-stud-dept', 'new-fac-dept', 'new-course-dept'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = optionsHtml;
    });
  },

  renderStats() {
    const users = DB.get('users');
    const courses = DB.get('courses');
    const notices = DB.get('notices');
    const depts = DB.get('departments');

    const studentCount = users.filter(u => u.role === 'student').length;
    const facultyCount = users.filter(u => u.role === 'faculty').length;

    const elS = document.getElementById('stat-admin-students');
    const elF = document.getElementById('stat-admin-faculty');
    const elC = document.getElementById('stat-admin-courses');
    const elN = document.getElementById('stat-admin-notices');
    const elD = document.getElementById('stat-admin-depts');

    if (elS) elS.innerText = studentCount;
    if (elF) elF.innerText = facultyCount;
    if (elC) elC.innerText = courses.length;
    if (elN) elN.innerText = notices.length;
    if (elD) elD.innerText = depts.length;
  },

  renderDepartments() {
    const depts = DB.get('departments');
    const courses = DB.get('courses');
    const students = DB.get('users').filter(u => u.role === 'student');
    const faculty = DB.get('users').filter(u => u.role === 'faculty');
    const tbody = document.getElementById('admin-dept-tbody');
    if (!tbody) return;

    if (depts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">No departments found. Click "Add Department" to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = depts.map(d => {
      const courseCount = courses.filter(c => c.deptId === d.id).length;
      const studentCount = students.filter(s => s.deptId === d.id).length;
      const facultyCount = faculty.filter(f => f.deptId === d.id).length;

      return `
        <tr>
          <td><span class="badge bg-primary fs-6">${d.code}</span></td>
          <td><strong>${d.name}</strong></td>
          <td>${d.hod || 'To Be Appointed'}</td>
          <td><span class="badge bg-light text-dark border">${facultyCount} Faculty</span></td>
          <td><span class="badge bg-light text-dark border">${studentCount} Students</span></td>
          <td><span class="badge bg-light text-dark border">${courseCount} Courses</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" onclick="Admin.deleteDepartment(${d.id})">
              <i class="bi bi-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  addDepartment(event) {
    event.preventDefault();
    const code = document.getElementById('new-dept-code').value.trim().toUpperCase();
    const name = document.getElementById('new-dept-name').value.trim();
    const hod = document.getElementById('new-dept-hod').value.trim();

    if (!code || !name) {
      alert('Please enter department code and name.');
      return;
    }

    const depts = DB.get('departments');
    if (depts.some(d => d.code.toLowerCase() === code.toLowerCase())) {
      alert('A department with this code already exists!');
      return;
    }

    depts.push({
      id: DB.nextId('departments'),
      code,
      name,
      hod: hod || 'To Be Appointed'
    });
    DB.set('departments', depts);

    const modalEl = document.getElementById('addDepartmentModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    document.getElementById('add-dept-form').reset();

    App.showToast(`Department "${code} - ${name}" added successfully!`, 'success');
    this.render();
  },

  deleteDepartment(id) {
    const courses = DB.get('courses');
    const students = DB.get('users').filter(u => u.deptId === id);
    const faculty = DB.get('users').filter(u => u.deptId === id);

    if (courses.some(c => c.deptId === id) || students.length > 0 || faculty.length > 0) {
      alert('Cannot delete this department because students, faculty, or courses are already assigned to it! Please reassign or delete them first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this department?')) return;
    let depts = DB.get('departments').filter(d => d.id !== id);
    DB.set('departments', depts);
    App.showToast('Department removed successfully.', 'info');
    this.render();
  },

  renderStudents() {
    const users = DB.get('users').filter(u => u.role === 'student');
    const depts = DB.get('departments');
    const tbody = document.getElementById('admin-student-tbody');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No students found. Add one above!</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(s => {
      const dept = depts.find(d => d.id === s.deptId) || { code: 'N/A' };
      return `
        <tr>
          <td><span class="badge bg-light text-dark border">${s.rollNo || 'N/A'}</span></td>
          <td><strong>${s.name}</strong></td>
          <td><span class="badge bg-primary-subtle text-primary">${dept.code}</span></td>
          <td>Semester ${s.semester || 1}</td>
          <td>${s.email}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" onclick="Admin.deleteStudent(${s.id})">
              <i class="bi bi-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  addStudent(event) {
    event.preventDefault();
    const name = document.getElementById('new-stud-name').value.trim();
    const rollNo = document.getElementById('new-stud-roll').value.trim().toUpperCase();
    const deptId = Number(document.getElementById('new-stud-dept').value);
    const semester = Number(document.getElementById('new-stud-sem').value);
    const email = document.getElementById('new-stud-email').value.trim();

    if (!name || !rollNo || !email) {
      alert('Please fill out all required fields.');
      return;
    }

    const users = DB.get('users');
    if (users.some(u => u.username.toLowerCase() === rollNo.toLowerCase())) {
      alert('A student with this Roll Number already exists!');
      return;
    }

    const newStudent = {
      id: DB.nextId('users'),
      username: rollNo,
      password: '123',
      role: 'student',
      name,
      rollNo,
      deptId,
      semester,
      email
    };

    users.push(newStudent);
    DB.set('users', users);

    const modalEl = document.getElementById('addStudentModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    document.getElementById('add-student-form').reset();

    App.showToast('Student Added Successfully! (Default password is 123)', 'success');
    this.render();
  },

  deleteStudent(id) {
    if (!confirm('Are you sure you want to remove this student? All their enrollments and attendance records will be removed.')) return;
    
    let users = DB.get('users').filter(u => u.id !== id);
    DB.set('users', users);

    let enrollments = DB.get('enrollments');
    const removedEnrollIds = enrollments.filter(e => e.studentId === id).map(e => e.id);
    enrollments = enrollments.filter(e => e.studentId !== id);
    DB.set('enrollments', enrollments);

    let att = DB.get('attendance').filter(a => !removedEnrollIds.includes(a.enrollmentId));
    DB.set('attendance', att);

    let grades = DB.get('grades').filter(g => !removedEnrollIds.includes(g.enrollmentId));
    DB.set('grades', grades);

    App.showToast('Student record deleted.', 'info');
    this.render();
  },

  renderFaculty() {
    const faculty = DB.get('users').filter(u => u.role === 'faculty');
    const depts = DB.get('departments');
    const tbody = document.getElementById('admin-faculty-tbody');
    if (!tbody) return;

    if (faculty.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No faculty found. Add one above!</td></tr>';
      return;
    }

    tbody.innerHTML = faculty.map(f => {
      const dept = depts.find(d => d.id === f.deptId) || { code: 'N/A' };
      const displayId = f.facultyId || f.username || `FAC-${f.id}`;
      return `
        <tr>
          <td>
            <span class="badge bg-primary-subtle text-primary border font-monospace fs-6">${displayId}</span>
            <div class="small text-muted mt-1">Username: <code>${f.username}</code></div>
          </td>
          <td><strong>${f.name}</strong></td>
          <td><span class="badge bg-info-subtle text-info-emphasis">${dept.code}</span></td>
          <td>${f.designation || 'Instructor'}</td>
          <td>${f.email}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" onclick="Admin.deleteFaculty(${f.id})">
              <i class="bi bi-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  addFaculty(event) {
    event.preventDefault();
    const facIdInput = document.getElementById('new-fac-id');
    const facId = facIdInput ? facIdInput.value.trim().toUpperCase() : '';
    const name = document.getElementById('new-fac-name').value.trim();
    const deptId = Number(document.getElementById('new-fac-dept').value);
    const designation = document.getElementById('new-fac-desig').value.trim();
    const email = document.getElementById('new-fac-email').value.trim();
    const passInput = document.getElementById('new-fac-pass');
    const password = (passInput && passInput.value.trim()) || '123';

    if (!facId || !name || !email) {
      alert('Please fill out Faculty ID, Name, and Email.');
      return;
    }

    const users = DB.get('users');
    if (users.some(u => 
      (u.facultyId && u.facultyId.toLowerCase() === facId.toLowerCase()) || 
      (u.username && u.username.toLowerCase() === facId.toLowerCase())
    )) {
      alert(`A faculty member with ID "${facId}" already exists! Please use a unique Faculty ID.`);
      return;
    }

    const newFaculty = {
      id: DB.nextId('users'),
      facultyId: facId,
      username: facId.toLowerCase(),
      password,
      role: 'faculty',
      name,
      deptId,
      designation: designation || 'Assistant Professor',
      email
    };

    users.push(newFaculty);
    DB.set('users', users);

    const modalEl = document.getElementById('addFacultyModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    document.getElementById('add-faculty-form').reset();

    App.showToast(`Faculty Added! Login Username: "${facId}", Password: "${password}"`, 'success');
    this.render();
  },

  deleteFaculty(id) {
    if (!confirm('Remove this faculty member? Assigned courses will be unassigned.')) return;
    
    let users = DB.get('users').filter(u => u.id !== id);
    DB.set('users', users);

    let courses = DB.get('courses');
    courses.forEach(c => {
      if (c.facultyId === id) c.facultyId = null;
    });
    DB.set('courses', courses);

    App.showToast('Faculty member removed.', 'info');
    this.render();
  },

  renderCourses() {
    const courses = DB.get('courses');
    const depts = DB.get('departments');
    const faculty = DB.get('users').filter(u => u.role === 'faculty');
    const tbody = document.getElementById('admin-course-tbody');
    if (!tbody) return;

    const facSelect = document.getElementById('alloc-fac-select');
    if (facSelect) {
      facSelect.innerHTML = '<option value="">-- Select Teacher --</option>' + 
        faculty.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    }

    if (courses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">No courses found.</td></tr>';
      return;
    }

    tbody.innerHTML = courses.map(c => {
      const dept = depts.find(d => d.id === c.deptId) || { code: 'N/A' };
      const teacher = faculty.find(f => f.id === c.facultyId);
      return `
        <tr>
          <td><strong>${c.code}</strong></td>
          <td>${c.name}</td>
          <td><span class="badge bg-secondary-subtle text-secondary-emphasis">${dept.code}</span></td>
          <td>Sem ${c.semester}</td>
          <td>${c.credits} Credits</td>
          <td>
            ${teacher ? `<span class="text-success font-monospace"><i class="bi bi-person-check"></i> ${teacher.name}</span>` : '<span class="text-danger fst-italic"><i class="bi bi-exclamation-circle"></i> Not Assigned</span>'}
          </td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="Admin.openAllocateModal(${c.id})">
              <i class="bi bi-person-plus"></i> Assign
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="Admin.deleteCourse(${c.id})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  addCourse(event) {
    event.preventDefault();
    const code = document.getElementById('new-course-code').value.trim().toUpperCase();
    const name = document.getElementById('new-course-name').value.trim();
    const deptId = Number(document.getElementById('new-course-dept').value);
    const semester = Number(document.getElementById('new-course-sem').value);
    const credits = Number(document.getElementById('new-course-credits').value);

    if (!code || !name) {
      alert('Please fill out course code and name.');
      return;
    }

    const courses = DB.get('courses');
    if (courses.some(c => c.code.toLowerCase() === code.toLowerCase())) {
      alert('A course with this code already exists!');
      return;
    }

    courses.push({
      id: DB.nextId('courses'),
      code,
      name,
      deptId,
      semester,
      credits,
      facultyId: null
    });
    DB.set('courses', courses);

    const modalEl = document.getElementById('addCourseModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    document.getElementById('add-course-form').reset();

    App.showToast('Course Created Successfully!', 'success');
    this.render();
  },

  openAllocateModal(courseId) {
    const course = DB.get('courses').find(c => c.id === courseId);
    if (!course) return;
    document.getElementById('alloc-course-id').value = course.id;
    document.getElementById('alloc-course-name-lbl').innerText = `${course.code}: ${course.name}`;
    document.getElementById('alloc-fac-select').value = course.facultyId || '';
    
    const modal = new bootstrap.Modal(document.getElementById('allocateFacultyModal'));
    modal.show();
  },

  saveAllocation(event) {
    event.preventDefault();
    const courseId = Number(document.getElementById('alloc-course-id').value);
    const facultyId = document.getElementById('alloc-fac-select').value ? Number(document.getElementById('alloc-fac-select').value) : null;

    const courses = DB.get('courses');
    const course = courses.find(c => c.id === courseId);
    if (course) {
      course.facultyId = facultyId;
      DB.set('courses', courses);
      
      const modalEl = document.getElementById('allocateFacultyModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      App.showToast('Faculty allocated to course!', 'success');
      this.render();
    }
  },

  deleteCourse(id) {
    if (!confirm('Delete this course? Associated student enrollments will also be removed.')) return;
    let courses = DB.get('courses').filter(c => c.id !== id);
    DB.set('courses', courses);
    let enrollments = DB.get('enrollments').filter(e => e.courseId !== id);
    DB.set('enrollments', enrollments);
    App.showToast('Course removed.', 'info');
    this.render();
  },

  renderNotices() {
    const notices = DB.get('notices');
    const container = document.getElementById('admin-notice-list');
    if (!container) return;

    if (notices.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-3">No announcements published.</p>';
      return;
    }

    container.innerHTML = notices.map(n => `
      <div class="notice-card ${n.target === 'students' ? 'urgent' : ''}">
        <div class="d-flex justify-content-between align-items-start">
          <h6 class="mb-1 font-semibold text-primary">${n.title}</h6>
          <div>
            <span class="badge bg-secondary text-uppercase" style="font-size:0.7rem;">${n.target}</span>
            <button class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="Admin.deleteNotice(${n.id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <p class="mb-1 text-muted text-sm">${n.content}</p>
        <div class="text-xs text-secondary mt-1">
          <i class="bi bi-clock"></i> Posted on ${n.date} by <strong>${n.postedBy}</strong>
        </div>
      </div>
    `).join('');
  },

  addNotice(event) {
    event.preventDefault();
    const title = document.getElementById('new-notice-title').value.trim();
    const target = document.getElementById('new-notice-target').value;
    const content = document.getElementById('new-notice-content').value.trim();

    if (!title || !content) {
      alert('Please enter title and content.');
      return;
    }

    const notices = DB.get('notices');
    notices.unshift({
      id: DB.nextId('notices'),
      title,
      target,
      content,
      postedBy: Auth.getCurrentUser().name,
      date: new Date().toISOString().split('T')[0]
    });
    DB.set('notices', notices);

    document.getElementById('new-notice-title').value = '';
    document.getElementById('new-notice-content').value = '';
    App.showToast('Notice published to portal!', 'success');
    this.render();
  },

  deleteNotice(id) {
    let notices = DB.get('notices').filter(n => n.id !== id);
    DB.set('notices', notices);
    App.showToast('Notice deleted.', 'info');
    this.render();
  }
};
