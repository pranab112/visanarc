# Registration Hardcoded Data Issues

## Current Hardcoded Values

When registering a new agency, these values are automatically set:

1. **Staff Account**
   - Name: "Default Staff"
   - Email: `staff@{agencyname}.com`
   - Password: "staff123"

2. **Agency Settings**
   - Default Country: Australia
   - Currency: NPR (Nepalese Rupee)
   - Payment Status: paid
   - Subscription: Enterprise
   - Branch: "Head Office" at "Main"

3. **Notifications**
   - Email on Visa: true
   - Daily Reminders: true

## Quick Fix Options

### Option 1: Update Default Values
Change hardcoded values in `/services/authService.ts` line 51-55 to more appropriate defaults for your use case.

### Option 2: Add Registration Fields
Extend the registration form to collect:
- Country preference
- Currency preference
- Staff member details
- Initial branch location

### Option 3: Post-Registration Setup
Create a setup wizard that runs after registration to configure:
- Agency preferences
- Staff accounts
- Branch details
- Notification settings

## Immediate Workaround

After registration, users can:
1. Go to Settings → Agency Settings to update defaults
2. Go to Settings → Team Management to add proper staff
3. Go to Settings → Branch Management to update branch info

## Recommended Action

For now, the hardcoded defaults allow quick registration. After login:
1. Navigate to Settings
2. Update agency information
3. Add real staff members
4. Configure proper branches

The "paid" status and "Enterprise" plan are set to give full access during demo/development.