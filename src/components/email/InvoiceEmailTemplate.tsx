import React from "react";

interface InvoiceEmailTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  clientName: string;
  organizationName: string;
  organizationLogo?: string;
  viewInvoiceUrl?: string;
}

export const InvoiceEmailTemplate: React.FC<InvoiceEmailTemplateProps> = ({
  invoiceNumber,
  invoiceDate,
  dueDate,
  totalAmount,
  clientName,
  organizationName,
  organizationLogo,
  viewInvoiceUrl,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e40af',
        padding: '32px',
        textAlign: 'center',
      }}>
        {organizationLogo && (
          <img 
            src={organizationLogo} 
            alt={organizationName}
            style={{
              maxWidth: '200px',
              marginBottom: '16px',
            }}
          />
        )}
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0',
        }}>
          New Invoice
        </h1>
      </div>

      {/* Content */}
      <div style={{ padding: '32px' }}>
        <p style={{
          fontSize: '16px',
          color: '#374151',
          marginBottom: '24px',
        }}>
          Dear {clientName},
        </p>

        <p style={{
          fontSize: '16px',
          color: '#374151',
          marginBottom: '24px',
          lineHeight: '1.6',
        }}>
          A new invoice has been generated for your account. Please find the details below:
        </p>

        {/* Invoice Details Box */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Invoice Number</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
              {invoiceNumber}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Invoice Date</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#111827' }}>
              {formatDate(invoiceDate)}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Due Date</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#111827' }}>
              {formatDate(dueDate)}
            </p>
          </div>

          <div style={{
            borderTop: '2px solid #e5e7eb',
            paddingTop: '16px',
            marginTop: '16px',
          }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Amount Due</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        {viewInvoiceUrl && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <a href={viewInvoiceUrl} style={{
              display: 'inline-block',
              backgroundColor: '#1e40af',
              color: '#ffffff',
              padding: '14px 32px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
            }}>
              View Invoice
            </a>
          </div>
        )}

        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          lineHeight: '1.6',
          marginBottom: '16px',
        }}>
          If you have any questions about this invoice, please don't hesitate to contact us.
        </p>

        <p style={{
          fontSize: '16px',
          color: '#374151',
          marginBottom: '8px',
        }}>
          Best regards,
        </p>
        <p style={{
          fontSize: '16px',
          color: '#374151',
          fontWeight: '600',
        }}>
          {organizationName}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
      }}>
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: '0 0 8px 0',
        }}>
          This is an automated email. Please do not reply directly to this message.
        </p>
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: '0',
        }}>
          © {new Date().getFullYear()} {organizationName}. All rights reserved.
        </p>
      </div>
    </div>
  );
};
