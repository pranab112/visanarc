// Initialize demo users in localStorage for the application
// Run this in the browser console or as a script

const initializeDemoUsers = () => {
  // Demo users with their passwords
  const demoUsers = [
    {
      id: 'mock-admin-id',
      name: 'System Administrator',
      email: 'admin@demo.com',
      role: 'Owner',
      agencyId: 'local-dev-agency',
      paymentStatus: 'paid',
      mockPassword: 'password'
    },
    {
      id: 'mock-staff-id',
      name: 'Lead Counsellor',
      email: 'staff@demo.com',
      role: 'Counsellor',
      agencyId: 'local-dev-agency',
      paymentStatus: 'paid',
      mockPassword: 'password'
    },
    {
      id: '1',
      name: 'Ram Karki',
      email: 'student@demo.com',
      role: 'Student',
      agencyId: 'local-dev-agency',
      paymentStatus: 'paid',
      mockPassword: 'password'
    }
  ];

  // Save to localStorage
  localStorage.setItem('sag_mock_user_registry', JSON.stringify(demoUsers));

  // Set agency payment status
  localStorage.setItem('sag_payment_local-dev-agency', 'paid');

  // Initialize agency settings
  const agencySettings = {
    agencyName: 'Demo Agency',
    email: 'admin@demo.com',
    phone: '',
    address: '',
    defaultCountry: 'Australia',
    currency: 'NPR',
    paymentStatus: 'paid',
    notifications: { emailOnVisa: true, dailyReminders: true },
    subscription: { plan: 'Enterprise' },
    branches: [{id: 'main', name: 'Head Office', location: 'Main'}]
  };

  localStorage.setItem('sag_settings_local-dev-agency', JSON.stringify(agencySettings));

  console.log('Demo users initialized successfully!');
  console.log('You can now login with:');
  console.log('admin@demo.com / password');
  console.log('staff@demo.com / password');
  console.log('student@demo.com / password');
};

// Execute the initialization
initializeDemoUsers();