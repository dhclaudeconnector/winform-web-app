export const APP_CONFIG = {
  title: 'Hospital Management System',
  company: 'HOSPITAL ADMIN',
  subtitle: 'Hệ thống quản lý bệnh viện',
  theme: {
    primary: '#1a6fc4',
    sidebar: '#1e3a5f',
    accent: '#f0a500',
  },
  modules: [
    { id: 'users', title: 'Quản lý người dùng' },
    { id: 'departments', title: 'Quản lý khoa phòng' },
    { id: 'patients', title: 'Quản lý bệnh nhân' },
    { id: 'doctors', title: 'Quản lý bác sĩ' },
    { id: 'appointments', title: 'Quản lý lịch hẹn' },
    { id: 'medical-records', title: 'Hồ sơ bệnh án' },
    { id: 'role-management', title: 'Quản lý vai trò' },
    { id: 'user-permissions', title: 'Phân quyền người dùng' },
  ],
  sections: {
    'Quản trị hệ thống': ['users', 'departments', 'role-management', 'user-permissions'],
    'Quản lý khám bệnh': ['patients', 'doctors', 'appointments'],
    'Hồ sơ y tế': ['medical-records'],
  },
}
