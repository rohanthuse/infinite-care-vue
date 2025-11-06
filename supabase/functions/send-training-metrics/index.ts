import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

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

const generateTrainingMetricsContent = (data: TrainingMetricsEmailData) => {
  const { branchName, metrics, reportDate } = data;
  
  return `
    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="color: #1e40af; margin: 0 0 8px 0;">Training Metrics Report</h2>
      <p style="color: #1e40af; margin: 0; font-size: 18px; font-weight: 600;">${branchName}</p>
      <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">
        Generated on ${new Date(reportDate).toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
    </div>

    <div style="margin: 24px 0;">
      <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        Executive Summary
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${metrics.summary.totalStaff}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Total Staff</div>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid ${metrics.summary.overallComplianceRate >= 80 ? '#059669' : metrics.summary.overallComplianceRate >= 60 ? '#d97706' : '#dc2626'};">
          <div style="font-size: 24px; font-weight: bold; color: ${metrics.summary.overallComplianceRate >= 80 ? '#059669' : metrics.summary.overallComplianceRate >= 60 ? '#d97706' : '#dc2626'};">
            ${metrics.summary.overallComplianceRate}%
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Overall Compliance</div>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid ${metrics.summary.overdueTrainings > 0 ? '#dc2626' : '#059669'};">
          <div style="font-size: 24px; font-weight: bold; color: ${metrics.summary.overdueTrainings > 0 ? '#dc2626' : '#059669'};">
            ${metrics.summary.overdueTrainings}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Overdue Trainings</div>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid ${metrics.summary.expiringTrainings > 0 ? '#d97706' : '#059669'};">
          <div style="font-size: 24px; font-weight: bold; color: ${metrics.summary.expiringTrainings > 0 ? '#d97706' : '#059669'};">
            ${metrics.summary.expiringTrainings}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Expiring Soon</div>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${metrics.summary.completedThisMonth}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Completed This Month</div>
        </div>
      </div>
    </div>

    ${metrics.summary.overdueTrainings > 0 ? `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #dc2626;">
      <div style="color: #dc2626; font-weight: bold; margin-bottom: 12px; font-size: 16px;">⚠️ Urgent Action Required</div>
      <p style="margin: 0 0 16px 0; color: #991b1b; font-size: 14px;">
        <strong>${metrics.summary.overdueTrainings}</strong> training records are overdue and require immediate attention.
      </p>
      <div>
        ${metrics.staffMetrics.filter(s => s.overdue > 0).map(staff => `
          <div style="margin: 8px 0; padding: 12px; background: white; border-radius: 6px;">
            <strong style="color: #1f2937;">${staff.staffName}</strong> - <span style="color: #dc2626;">${staff.overdue} overdue training(s)</span>
            ${staff.overdueTrainings.map(t => `
              <div style="margin-left: 20px; color: #dc2626; font-size: 13px; margin-top: 4px;">
                • ${t.trainingTitle} <span style="font-weight: bold;">(${t.daysPastDue} days overdue)</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div style="margin: 32px 0;">
      <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        Staff Training Compliance
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Staff Member</th>
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Specialization</th>
            <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Compliance</th>
            <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Overdue</th>
            <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Expiring</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.staffMetrics.map(staff => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>${staff.staffName}</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${staff.specialization || 'General'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: ${staff.complianceRate >= 80 ? '#059669' : staff.complianceRate >= 60 ? '#d97706' : '#dc2626'}; font-weight: bold;">
                ${staff.complianceRate}%
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: ${staff.overdue > 0 ? '#dc2626' : '#059669'}; font-weight: bold;">
                ${staff.overdue}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: ${staff.expiring > 0 ? '#d97706' : '#059669'}; font-weight: bold;">
                ${staff.expiring}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="margin: 32px 0;">
      <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        Training Category Performance
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Category</th>
            <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Compliance Rate</th>
            <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Overdue Records</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.categoryMetrics.map(category => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>${category.category}</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: ${category.complianceRate >= 80 ? '#059669' : category.complianceRate >= 60 ? '#d97706' : '#dc2626'}; font-weight: bold;">
                ${category.complianceRate}%
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: ${category.overdue > 0 ? '#dc2626' : '#059669'}; font-weight: bold;">
                ${category.overdue}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin-top: 32px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        This report was generated automatically by the Med-Infinite Training Management System. For questions or concerns, please contact your system administrator.
      </p>
    </div>
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
    const content = generateTrainingMetricsContent(data);

    const html = generateMedInfiniteEmailHTML({
      title: `Training Metrics Report - ${data.branchName}`,
      previewText: `Training compliance report for ${data.branchName} - ${data.metrics.summary.overallComplianceRate}% overall compliance`,
      content,
    });

    const emailResponse = await resend.emails.send({
      from: "Med-Infinite Training <onboarding@resend.dev>",
      to: data.recipients,
      subject: subject,
      html,
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
