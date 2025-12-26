import React from 'react';

/**
 * LicensingGuard has been decommissioned.
 * The application now boots directly to the Login/Dashboard.
 */
export const LicensingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};