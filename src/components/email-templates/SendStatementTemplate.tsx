/**
 * Professional Send Statement Email Template
 * Jay Kay Digital Press - Account Statement with Transaction History
 */

interface StatementTransaction {
  date: string;
  description: string;
  reference: string;
  type: "invoice" | "payment" | "credit" | "adjustment";
  debit?: number;
  credit?: number;
  balance: number;
}

interface SendStatementTemplateProps {
  customerName: string;
  customerAddress?: string;
  statementNumber: string;
  statementDate: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  transactions: StatementTransaction[];
  totalDebits: number;
  totalCredits: number;
  outstandingAmount: number;
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
  paymentInstructions?: string;
  notes?: string;
}

export const SendStatementTemplate: React.FC<SendStatementTemplateProps> = ({
  customerName,
  customerAddress,
  statementNumber,
  statementDate,
  periodStart,
  periodEnd,
  openingBalance,
  closingBalance,
  transactions,
  totalDebits,
  totalCredits,
  outstandingAmount,
  companyDetails,
  paymentInstructions,
  notes,
}) => {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        color: "#333333",
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header with Company Logo and Branding */}
      <div
        style={{
          backgroundColor: "#dc2626",
          color: "#ffffff",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0",
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          {companyDetails.name}
        </h1>
        <p
          style={{
            margin: "5px 0 0 0",
            fontSize: "14px",
            opacity: "0.9",
          }}
        >
          Professional Printing & Digital Services
        </p>
      </div>

      {/* Statement Header */}
      <div
        style={{
          padding: "30px",
          backgroundColor: "#f8f9fa",
          borderBottom: "3px solid #dc2626",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 10px 0",
                fontSize: "24px",
                color: "#dc2626",
              }}
            >
              ACCOUNT STATEMENT
            </h2>
            <p style={{ margin: "5px 0", fontSize: "16px" }}>
              <strong>Statement #:</strong> {statementNumber}
            </p>
            <p style={{ margin: "5px 0", fontSize: "16px" }}>
              <strong>Statement Date:</strong> {statementDate}
            </p>
            <p style={{ margin: "5px 0", fontSize: "16px" }}>
              <strong>Period:</strong> {periodStart} to {periodEnd}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#dc2626" }}>
              Account Holder:
            </h3>
            <p
              style={{ margin: "5px 0", fontSize: "16px", fontWeight: "bold" }}
            >
              {customerName}
            </p>
            {customerAddress && (
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                {customerAddress}
              </p>
            )}
          </div>
        </div>

        {/* Account Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div style={summaryBoxStyle}>
            <h4 style={summaryTitleStyle}>Opening Balance</h4>
            <p
              style={{
                ...summaryValueStyle,
                color: openingBalance >= 0 ? "#059669" : "#dc2626",
              }}
            >
              SLL {openingBalance.toLocaleString()}
            </p>
          </div>

          <div style={summaryBoxStyle}>
            <h4 style={summaryTitleStyle}>Total Debits</h4>
            <p style={{ ...summaryValueStyle, color: "#dc2626" }}>
              SLL {totalDebits.toLocaleString()}
            </p>
          </div>

          <div style={summaryBoxStyle}>
            <h4 style={summaryTitleStyle}>Total Credits</h4>
            <p style={{ ...summaryValueStyle, color: "#059669" }}>
              SLL {totalCredits.toLocaleString()}
            </p>
          </div>

          <div
            style={{
              ...summaryBoxStyle,
              backgroundColor: "#dc2626",
              color: "#ffffff",
            }}
          >
            <h4 style={{ ...summaryTitleStyle, color: "#ffffff" }}>
              Closing Balance
            </h4>
            <p
              style={{
                ...summaryValueStyle,
                color: "#ffffff",
                fontSize: "20px",
              }}
            >
              SLL {closingBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ padding: "30px" }}>
        <h3
          style={{
            margin: "0 0 20px 0",
            fontSize: "20px",
            color: "#dc2626",
            borderBottom: "2px solid #dc2626",
            paddingBottom: "10px",
          }}
        >
          Transaction History
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20px",
              minWidth: "700px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th style={tableHeaderStyle}>Date</th>
                <th style={tableHeaderStyle}>Description</th>
                <th style={tableHeaderStyle}>Reference</th>
                <th style={tableHeaderStyle}>Type</th>
                <th style={{ ...tableHeaderStyle, textAlign: "right" }}>
                  Debit
                </th>
                <th style={{ ...tableHeaderStyle, textAlign: "right" }}>
                  Credit
                </th>
                <th style={{ ...tableHeaderStyle, textAlign: "right" }}>
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tableCellStyle}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td style={tableCellStyle}>{transaction.description}</td>
                  <td style={tableCellStyle}>{transaction.reference}</td>
                  <td style={tableCellStyle}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: getTypeColor(transaction.type).bg,
                        color: getTypeColor(transaction.type).text,
                      }}
                    >
                      {transaction.type.toUpperCase()}
                    </span>
                  </td>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: "right",
                      color: "#dc2626",
                    }}
                  >
                    {transaction.debit
                      ? `SLL ${transaction.debit.toLocaleString()}`
                      : "-"}
                  </td>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: "right",
                      color: "#059669",
                    }}
                  >
                    {transaction.credit
                      ? `SLL ${transaction.credit.toLocaleString()}`
                      : "-"}
                  </td>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: "right",
                      fontWeight: "bold",
                      color: transaction.balance >= 0 ? "#059669" : "#dc2626",
                    }}
                  >
                    SLL {transaction.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Outstanding Amount Alert */}
        {outstandingAmount > 0 && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#fef2f2",
              border: "2px solid #fecaca",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>⚠️</span>
              <div>
                <h4 style={{ margin: "0 0 5px 0", color: "#dc2626" }}>
                  Outstanding Amount
                </h4>
                <p
                  style={{
                    margin: "0",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#dc2626",
                  }}
                >
                  SLL {outstandingAmount.toLocaleString()}
                </p>
                <p
                  style={{
                    margin: "5px 0 0 0",
                    fontSize: "14px",
                    color: "#7f1d1d",
                  }}
                >
                  Please settle this amount at your earliest convenience.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      <div
        style={{
          padding: "30px",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#dc2626" }}>
          Payment Instructions
        </h3>

        {paymentInstructions ? (
          <p style={{ margin: "0 0 15px 0", fontSize: "14px" }}>
            {paymentInstructions}
          </p>
        ) : (
          <div>
            <p style={{ margin: "0 0 15px 0", fontSize: "14px" }}>
              For payments, please use any of the following methods:
            </p>
            <ul
              style={{
                margin: "0 0 15px 0",
                paddingLeft: "20px",
                fontSize: "14px",
              }}
            >
              <li>Visit our office for cash payment</li>
              <li>Mobile Money: Orange Money, Afrimoney</li>
              <li>Bank Transfer (contact us for account details)</li>
              <li>Card payment (in-person only)</li>
            </ul>
          </div>
        )}

        {notes && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#374151" }}>
              Additional Notes:
            </h4>
            <p style={{ margin: "0", fontSize: "14px", fontStyle: "italic" }}>
              {notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer with Company Information */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#dc2626",
          color: "#ffffff",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "15px" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
            {companyDetails.name}
          </h3>
          <p style={{ margin: "5px 0", fontSize: "14px" }}>
            {companyDetails.address}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            flexWrap: "wrap",
            fontSize: "14px",
          }}
        >
          <span>📞 {companyDetails.phone}</span>
          <span>✉️ {companyDetails.email}</span>
          {companyDetails.website && <span>🌐 {companyDetails.website}</span>}
        </div>

        <p
          style={{
            margin: "15px 0 0 0",
            fontSize: "12px",
            opacity: "0.8",
          }}
        >
          For questions about this statement, please contact us during business
          hours.
        </p>
      </div>
    </div>
  );
};

// Helper function for transaction type colors
const getTypeColor = (type: StatementTransaction["type"]) => {
  switch (type) {
    case "invoice":
      return { bg: "#fef3c7", text: "#92400e" };
    case "payment":
      return { bg: "#d1fae5", text: "#065f46" };
    case "credit":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "adjustment":
      return { bg: "#f3e8ff", text: "#7c2d12" };
    default:
      return { bg: "#f1f5f9", text: "#374151" };
  }
};

// Reusable styles
const summaryBoxStyle: React.CSSProperties = {
  padding: "15px",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  textAlign: "center",
};

const summaryTitleStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "14px",
  color: "#6b7280",
  fontWeight: "normal",
};

const summaryValueStyle: React.CSSProperties = {
  margin: "0",
  fontSize: "18px",
  fontWeight: "bold",
};

const tableHeaderStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "bold",
  fontSize: "14px",
  color: "#374151",
  borderBottom: "2px solid #dc2626",
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "14px",
  color: "#374151",
};

// Generate HTML string for email sending
export const generateStatementEmailHTML = (
  props: SendStatementTemplateProps,
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Statement ${props.statementNumber} - ${props.companyDetails.name}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 900px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">${props.companyDetails.name}</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Professional Printing & Digital Services</p>
        </div>
        
        <!-- Statement Details -->
        <div style="padding: 30px; background-color: #f8f9fa; border-bottom: 3px solid #dc2626;">
          <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #dc2626;">ACCOUNT STATEMENT</h2>
          <p><strong>Statement #:</strong> ${props.statementNumber}</p>
          <p><strong>Period:</strong> ${props.periodStart} to ${props.periodEnd}</p>
          <p><strong>Account Holder:</strong> ${props.customerName}</p>
          
          <div style="display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 150px; padding: 15px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Opening Balance</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${props.openingBalance >= 0 ? "#059669" : "#dc2626"};">
                SLL ${props.openingBalance.toLocaleString()}
              </p>
            </div>
            <div style="flex: 1; min-width: 150px; padding: 15px; background: #dc2626; color: white; border-radius: 8px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: white;">Closing Balance</h4>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: white;">
                SLL ${props.closingBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Transaction Summary -->
        <div style="padding: 30px;">
          <h3 style="margin: 0 0 20px 0; color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Transaction Summary</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dc2626;">Date</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dc2626;">Description</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dc2626;">Amount</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dc2626;">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${props.transactions
                  .map(
                    (transaction, index) => `
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
                    <td style="padding: 12px;">${new Date(transaction.date).toLocaleDateString()}</td>
                    <td style="padding: 12px;">${transaction.description}</td>
                    <td style="padding: 12px; text-align: right; color: ${transaction.debit ? "#dc2626" : "#059669"};">
                      ${transaction.debit ? `SLL ${transaction.debit.toLocaleString()}` : transaction.credit ? `SLL ${transaction.credit.toLocaleString()}` : "-"}
                    </td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; color: ${transaction.balance >= 0 ? "#059669" : "#dc2626"};">
                      SLL ${transaction.balance.toLocaleString()}
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          ${
            props.outstandingAmount > 0
              ? `
            <div style="margin-top: 20px; padding: 20px; background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #dc2626;">⚠️ Outstanding Amount</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #dc2626;">
                SLL ${props.outstandingAmount.toLocaleString()}
              </p>
            </div>
          `
              : ""
          }
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px; background-color: #dc2626; color: white; text-align: center;">
          <h3 style="margin: 0 0 10px 0;">${props.companyDetails.name}</h3>
          <p style="margin: 5px 0;">${props.companyDetails.address}</p>
          <p style="margin: 5px 0;">📞 ${props.companyDetails.phone} | ✉️ ${props.companyDetails.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default SendStatementTemplate;
