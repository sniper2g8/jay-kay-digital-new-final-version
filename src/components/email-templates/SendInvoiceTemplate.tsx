/**
 * Professional Send Invoice Email Template
 * Jay Kay Digital Press - Company Branding with Dynamic Fields
 */

interface SendInvoiceTemplateProps {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  totalAmount: number;
  paymentTerms: string;
  notes?: string;
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
}

export const SendInvoiceTemplate: React.FC<SendInvoiceTemplateProps> = ({
  customerName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  items,
  subtotal,
  tax = 0,
  totalAmount,
  paymentTerms,
  notes,
  companyDetails
}) => {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333333',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#ffffff'
    }}>
      {/* Header with Company Logo and Branding */}
      <div style={{
        backgroundColor: '#dc2626',
        color: '#ffffff',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{
          margin: '0',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          {companyDetails.name}
        </h1>
        <p style={{
          margin: '5px 0 0 0',
          fontSize: '14px',
          opacity: '0.9'
        }}>
          Professional Printing & Digital Services
        </p>
      </div>

      {/* Invoice Header */}
      <div style={{
        padding: '30px',
        backgroundColor: '#f8f9fa',
        borderBottom: '3px solid #dc2626'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 10px 0',
              fontSize: '24px',
              color: '#dc2626'
            }}>
              INVOICE
            </h2>
            <p style={{ margin: '5px 0', fontSize: '16px' }}>
              <strong>Invoice #:</strong> {invoiceNumber}
            </p>
            <p style={{ margin: '5px 0', fontSize: '16px' }}>
              <strong>Date:</strong> {invoiceDate}
            </p>
            <p style={{ margin: '5px 0', fontSize: '16px' }}>
              <strong>Due Date:</strong> <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{dueDate}</span>
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>Bill To:</h3>
            <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>
              {customerName}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div style={{ padding: '30px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '20px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={tableHeaderStyle}>Description</th>
              <th style={tableHeaderStyle}>Qty</th>
              <th style={tableHeaderStyle}>Unit Price</th>
              <th style={tableHeaderStyle}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={tableCellStyle}>{item.description}</td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                  SLL {item.unitPrice.toLocaleString()}
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 'bold' }}>
                  SLL {item.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{
          marginLeft: 'auto',
          width: '300px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Subtotal:</span>
            <span>SLL {subtotal.toLocaleString()}</span>
          </div>
          {tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Tax:</span>
              <span>SLL {tax.toLocaleString()}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '2px solid #dc2626',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#dc2626'
          }}>
            <span>Total:</span>
            <span>SLL {totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms and Instructions */}
      <div style={{
        padding: '30px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>Payment Terms & Instructions</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
          <strong>Payment Terms:</strong> {paymentTerms}
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Payment Methods:</h4>
          <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
            <li>Cash payment at our office</li>
            <li>Mobile Money: Orange Money, Afrimoney</li>
            <li>Bank Transfer (contact us for details)</li>
            <li>Card payment (in-person only)</li>
          </ul>
        </div>

        {notes && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Notes:</h4>
            <p style={{ margin: '0', fontSize: '14px', fontStyle: 'italic' }}>
              {notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer with Company Information */}
      <div style={{
        padding: '20px',
        backgroundColor: '#dc2626',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
            {companyDetails.name}
          </h3>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            {companyDetails.address}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          fontSize: '14px'
        }}>
          <span>📞 {companyDetails.phone}</span>
          <span>✉️ {companyDetails.email}</span>
          {companyDetails.website && (
            <span>🌐 {companyDetails.website}</span>
          )}
        </div>
        
        <p style={{
          margin: '15px 0 0 0',
          fontSize: '12px',
          opacity: '0.8'
        }}>
          Thank you for choosing Jay Kay Digital Press for your printing needs!
        </p>
      </div>
    </div>
  );
};

// Reusable styles
const tableHeaderStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: '14px',
  color: '#374151',
  borderBottom: '2px solid #dc2626'
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: '14px',
  color: '#374151'
};

// Generate HTML string for email sending
export const generateInvoiceEmailHTML = (props: SendInvoiceTemplateProps): string => {
  // This would typically use a server-side rendering solution
  // For now, return a static HTML template with interpolated values
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Invoice ${props.invoiceNumber} - ${props.companyDetails.name}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <!-- Email content would be rendered here -->
      <div style="max-width: 800px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">${props.companyDetails.name}</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Professional Printing & Digital Services</p>
        </div>
        
        <!-- Invoice Details -->
        <div style="padding: 30px; background-color: #f8f9fa; border-bottom: 3px solid #dc2626;">
          <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #dc2626;">INVOICE</h2>
          <p><strong>Invoice #:</strong> ${props.invoiceNumber}</p>
          <p><strong>Date:</strong> ${props.invoiceDate}</p>
          <p><strong>Due Date:</strong> <span style="color: #dc2626; font-weight: bold;">${props.dueDate}</span></p>
          <p><strong>Bill To:</strong> ${props.customerName}</p>
        </div>
        
        <!-- Items and Total -->
        <div style="padding: 30px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dc2626;">Description</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dc2626;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dc2626;">Unit Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dc2626;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${props.items.map(item => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px;">${item.description}</td>
                  <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right;">SLL ${item.unitPrice.toLocaleString()}</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">SLL ${item.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; font-size: 18px; font-weight: bold; color: #dc2626;">
            <p>Total: SLL ${props.totalAmount.toLocaleString()}</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px; background-color: #dc2626; color: white; text-align: center;">
          <h3 style="margin: 0 0 10px 0;">${props.companyDetails.name}</h3>
          <p style="margin: 5px 0;">${props.companyDetails.address}</p>
          <p style="margin: 5px 0;">📞 ${props.companyDetails.phone} | ✉️ ${props.companyDetails.email}</p>
          <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">
            Thank you for choosing Jay Kay Digital Press!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default SendInvoiceTemplate;