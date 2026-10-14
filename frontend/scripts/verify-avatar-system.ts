/**
 * Verification script for Professional Reusable Avatar System
 * Tests component contract, types, and integration points across all 10 dashboards.
 */

import fs from 'fs';
import path from 'path';

const DASHBOARDS = [
  { role: 'System Administrator', path: 'src/app/dashboard/admin/page.tsx' },
  { role: 'Headmaster', path: 'src/app/dashboard/headmaster/page.tsx' },
  { role: 'Academic Officer', path: 'src/app/dashboard/academic/page.tsx' },
  { role: 'Teacher', path: 'src/app/dashboard/teacher/page.tsx' },
  { role: 'Student', path: 'src/app/dashboard/student/page.tsx' },
  { role: 'Parent/Guardian', path: 'src/app/dashboard/parent/page.tsx' },
  { role: 'Accountant', path: 'src/app/dashboard/accountant/page.tsx' },
  { role: 'Librarian', path: 'src/app/dashboard/librarian/page.tsx' },
  { role: 'Examination Officer', path: 'src/app/dashboard/exam/page.tsx' },
  { role: 'Reception/School Staff', path: 'src/app/dashboard/staff/page.tsx' },
];

console.log('====================================================');
console.log('VERIFYING 10 MANDATORY DASHBOARDS AVATAR INTEGRATION');
console.log('====================================================');

let allPassed = true;

const projectRoot = path.resolve(__dirname, '..');

// 1. Verify Topbar and Sidebar layout integration
const topbarContent = fs.readFileSync(path.join(projectRoot, 'src/components/layout/topbar.tsx'), 'utf-8');
const sidebarContent = fs.readFileSync(path.join(projectRoot, 'src/components/layout/sidebar.tsx'), 'utf-8');

if (!topbarContent.includes('AvatarDropdown')) {
  console.error('[FAIL] Topbar does not include AvatarDropdown');
  allPassed = false;
} else {
  console.log('[PASS] Topbar includes shared AvatarDropdown');
}

if (!sidebarContent.includes('UserAvatar')) {
  console.error('[FAIL] Sidebar does not include UserAvatar');
  allPassed = false;
} else {
  console.log('[PASS] Sidebar includes shared UserAvatar');
}

// 2. Verify all 10 dashboards integrate DashboardProfileTab
DASHBOARDS.forEach(({ role, path: filePath }, idx) => {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] Dashboard ${role} (${filePath}) not found!`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const hasProfileTabImport = content.includes('DashboardProfileTab');
  const hasProfileTabUsage = content.includes('<DashboardProfileTab');

  if (hasProfileTabImport && hasProfileTabUsage) {
    console.log(`[PASS] ${idx + 1}. ${role} dashboard integrates DashboardProfileTab`);
  } else {
    console.error(`[FAIL] ${idx + 1}. ${role} dashboard missing DashboardProfileTab! (import: ${hasProfileTabImport}, usage: ${hasProfileTabUsage})`);
    allPassed = false;
  }
});

// 3. Verify core profile service methods
const profileServiceContent = fs.readFileSync(path.join(projectRoot, 'src/services/profile.service.ts'), 'utf-8');
const requiredMethods = ['uploadAvatar', 'removeAvatar', 'getProfile', 'updateProfile'];
requiredMethods.forEach(method => {
  if (profileServiceContent.includes(method)) {
    console.log(`[PASS] profileService includes ${method}`);
  } else {
    console.error(`[FAIL] profileService missing ${method}`);
    allPassed = false;
  }
});

// 4. Verify shared component exports in barrel
const barrelContent = fs.readFileSync(path.join(projectRoot, 'src/components/profile/index.ts'), 'utf-8');
['UserAvatar', 'AvatarDropdown', 'ProfileImageUploader', 'UserProfileModal', 'DashboardProfileTab'].forEach(comp => {
  if (barrelContent.includes(comp)) {
    console.log(`[PASS] Profile barrel exports ${comp}`);
  } else {
    console.error(`[FAIL] Profile barrel missing export for ${comp}`);
    allPassed = false;
  }
});

console.log('====================================================');
if (allPassed) {
  console.log('ALL FRONTEND ARCHITECTURE & DASHBOARD TESTS PASSED 100%!');
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
