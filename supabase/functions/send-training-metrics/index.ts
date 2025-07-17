import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrainingMetricsEmailData {
  branchName: string;
  recipients: string[];
  metrics: {
    summary: {
      totalStaff: number;
      totalTrainingRecords: number;
      overallComplianceRate: number;
      overdueTrainings: number;
      expiringTrainings: number;
      completedThisMonth: number;
    };
    staffMetrics: Array<{
      staffName: string;
      specialization: string | null;
      complianceRate: number;
      overdue: number;
      expiring: number;
      overdueTrainings: Array<{
        trainingTitle: string;
        daysPastDue: number;
      }>;
    }>;
    categoryMetrics: Array<{
      category: string;
      complianceRate: number;
      overdue: number;
    }>;
  };
  reportDate: string;
  subject?: string;
}

const generateTrainingMetricsHTML = (data: TrainingMetricsEmailData) => {
  const { branchName, metrics, reportDate } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Training Metrics Report - ${branchName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #4f46e5; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .metric-label { font-size: 12px; color: #64748b; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #f8fafc; font-weight: 600; color: #374151; }
        .compliance-high { color: #059669; font-weight: bold; }
        .compliance-medium { color: #d97706; font-weight: bold; }
        .compliance-low { color: #dc2626; font-weight: bold; }
        .alert-section { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .alert-title { color: #dc2626; font-weight: bold; margin-bottom: 10px; }
        .overdue-item { margin: 5px 0; padding: 8px; background: white; border-radius: 4px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Training Metrics Report</div>
          <h1>${branchName}</h1>
          <p>Generated on ${new Date(reportDate).toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <div class="section">
          <div class="section-title">Executive Summary</div>
          <div class="summary-grid">
            <div class="metric-card">
              <div class="metric-value">${metrics.summary.totalStaff}</div>
              <div class="metric-label">Total Staff</div>
            </div>
            <div class="metric-card">
              <div class="metric-value ${metrics.summary.overallComplianceRate >= 80 ? 'compliance-high' : metrics.summary.overallComplianceRate >= 60 ? 'compliance-medium' : 'compliance-low'}">${metrics.summary.overallComplianceRate}%</div>
              <div class="metric-label">Overall Compliance</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: ${metrics.summary.overdueTrainings > 0 ? '#dc2626' : '#059669'}">${metrics.summary.overdueTrainings}</div>
              <div class="metric-label">Overdue Trainings</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: ${metrics.summary.expiringTrainings > 0 ? '#d97706' : '#059669'}">${metrics.summary.expiringTrainings}</div>
              <div class="metric-label">Expiring Soon</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics.summary.completedThisMonth}</div>
              <div class="metric-label">Completed This Month</div>
            </div>
          </div>
        </div>

        ${metrics.summary.overdueTrainings > 0 ? `
        <div class="alert-section">
          <div class="alert-title">⚠️ Urgent Action Required</div>
          <p><strong>${metrics.summary.overdueTrainings}</strong> training records are overdue and require immediate attention.</p>
          <div>
            ${metrics.staffMetrics.filter(s => s.overdue > 0).map(staff => `
              <div class="overdue-item">
                <strong>${staff.staffName}</strong> - ${staff.overdue} overdue training(s)
                ${staff.overdueTrainings.map(t => `
                  <div style="margin-left: 20px; color: #dc2626;">• ${t.trainingTitle} (${t.daysPastDue} days overdue)</div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Staff Training Compliance</div>
          <table>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Specialization</th>
                <th>Compliance Rate</th>
                <th>Overdue</th>
                <th>Expiring Soon</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.staffMetrics.map(staff => `
                <tr>
                  <td><strong>${staff.staffName}</strong></td>
                  <td>${staff.specialization || 'General'}</td>
                  <td class="${staff.complianceRate >= 80 ? 'compliance-high' : staff.complianceRate >= 60 ? 'compliance-medium' : 'compliance-low'}">${staff.complianceRate}%</td>
                  <td style="color: ${staff.overdue > 0 ? '#dc2626' : '#059669'}">${staff.overdue}</td>
                  <td style="color: ${staff.expiring > 0 ? '#d97706' : '#059669'}">${staff.expiring}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Training Category Performance</div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Compliance Rate</th>
                <th>Overdue Records</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.categoryMetrics.map(category => `
                <tr>
                  <td><strong>${category.category}</strong></td>
                  <td class="${category.complianceRate >= 80 ? 'compliance-high' : category.complianceRate >= 60 ? 'compliance-medium' : 'compliance-low'}">${category.complianceRate}%</td>
                  <td style="color: ${category.overdue > 0 ? '#dc2626' : '#059669'}">${category.overdue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>This report was generated automatically by the Training Management System.</p>
          <p>For questions or concerns, please contact your system administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: TrainingMetricsEmailData = await req.json();
    console.log("Sending training metrics email for branch:", data.branchName);

    const subject = data.subject || `Training Metrics Report - ${data.branchName} - ${new Date(data.reportDate).toLocaleDateString('en-GB')}`;
    const htmlContent = generateTrainingMetricsHTML(data);

    const emailResponse = await resend.emails.send({
      from: "Training Management <training@yourdomain.com>",
      to: data.recipients,
      subject: subject,
      html: htmlContent,
    });

    console.log("Training metrics email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      message: "Training metrics email sent successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-training-metrics function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);