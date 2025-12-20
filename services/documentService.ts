import { Invoice, AgencySettings, Student, Country } from '../types';
import { UNIVERSAL_DOCS, COUNTRY_SPECIFIC_DOCS, DocRequirement } from '../constants';

/**
 * Auto-selects and calculates the required documents based on student profile.
 */
export const getRequiredDocuments = (student: Student): (DocRequirement & { isCountrySpecific: boolean })[] => {
    const country = student.targetCountry;
    
    // 1. Universal Documents
    const base = UNIVERSAL_DOCS.map(d => ({ ...d, isCountrySpecific: false }));
    
    // 2. Country Specific Documents
    const countrySpecific = (COUNTRY_SPECIFIC_DOCS[country] || []).map(d => ({ ...d, isCountrySpecific: true }));
    
    const allDocs = [...base, ...countrySpecific];

    // 3. Conditional Requirements based on Profile Data
    if ((student.educationGap || 0) > 0) {
        allDocs.push({ 
            name: 'Work Experience / Gap Evidence', 
            category: 'Academics', 
            isCountrySpecific: false, 
            condition: 'Required for Education Gap > 0' 
        });
    }
    
    if (student.previousRefusals) {
        allDocs.push({ 
            name: 'Previous Visa Refusal Letters', 
            category: 'Visa', 
            isCountrySpecific: false, 
            condition: 'Required for Prior Refusals' 
        });
    }

    return allDocs;
};

export const generateReceipt = (invoice: Invoice, settings: AgencySettings | null) => {
    const currency = settings?.currency || 'NPR';
    const agencyName = settings?.agencyName || 'StudyAbroad Genius';
    const agencyAddress = settings?.address || 'Kathmandu, Nepal';
    const agencyPhone = settings?.phone || '+977-1-4000000';
    const agencyEmail = settings?.email || 'info@agency.com';

    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
        alert("Pop-up blocked. Please allow pop-ups to print receipts.");
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt #${invoice.invoiceNumber}</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
                .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
                .meta { font-size: 12px; color: #666; }
                .title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; }
                .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .info-col { width: 45%; }
                .label { font-size: 10px; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 4px; }
                .value { font-size: 14px; font-weight: 500; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                .table th { text-align: left; padding: 12px; background: #f9fafb; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #eee; }
                .table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
                .total-section { display: flex; justify-content: flex-end; }
                .total-box { width: 250px; background: #f9fafb; padding: 20px; border-radius: 8px; }
                .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                .final-total { font-weight: bold; font-size: 18px; border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px; }
                .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
                .paid-stamp { 
                    position: absolute; 
                    top: 150px; 
                    right: 50px; 
                    border: 3px solid #10b981; 
                    color: #10b981; 
                    font-size: 24px; 
                    font-weight: bold; 
                    padding: 10px 20px; 
                    transform: rotate(-15deg); 
                    border-radius: 8px; 
                    opacity: 0.8;
                }
                @media print {
                    .no-print { display: none; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${invoice.status === 'Paid' ? '<div class="paid-stamp">PAID</div>' : ''}
            
            <div class="header">
                <div class="logo">${agencyName}</div>
                <div class="meta">${agencyAddress} • ${agencyPhone}</div>
                <div class="meta">${agencyEmail}</div>
            </div>

            <div class="title">Official Receipt</div>

            <div class="info-grid">
                <div class="info-col">
                    <div class="label">Billed To</div>
                    <div class="value">${invoice.studentName}</div>
                    <div class="value" style="font-size: 12px; color: #666; margin-top: 4px;">Student ID: ${invoice.studentId.substring(0,8)}</div>
                </div>
                <div class="info-col" style="text-align: right;">
                    <div class="label">Receipt Details</div>
                    <div class="value">No: ${invoice.invoiceNumber}</div>
                    <div class="value">Date: ${new Date(invoice.date).toLocaleDateString()}</div>
                </div>
            </div>

            <table class="table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${invoice.description}</td>
                        <td style="text-align: right;">${currency} ${invoice.amount.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-box">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>${currency} ${invoice.amount.toLocaleString()}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (0%)</span>
                        <span>${currency} 0</span>
                    </div>
                    <div class="total-row final-total">
                        <span>Total Paid</span>
                        <span>${currency} ${invoice.amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for your business.</p>
                <p>This is a computer-generated receipt.</p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
