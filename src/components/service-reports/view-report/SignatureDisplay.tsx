import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, User } from 'lucide-react';
import { format } from 'date-fns';

interface SignatureDisplayProps {
  carerSignature?: string | null;
  carerName?: string;
  clientSignature?: string | null;
  clientName?: string;
}

export function SignatureDisplay({
  carerSignature,
  carerName,
  clientSignature,
  clientName,
}: SignatureDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Carer Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Carer Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {carerSignature ? (
            <>
              <div className="border-2 border-border rounded-md p-4 bg-white dark:bg-muted/20 min-h-[150px] flex items-center justify-center">
                <img 
                  src={carerSignature} 
                  alt="Carer signature" 
                  className="max-h-[120px] max-w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {carerName || 'Unknown'}
                </p>
              </div>
            </>
          ) : (
            <div className="border-2 border-dashed border-border rounded-md p-4 min-h-[150px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No signature recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Client Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {clientSignature ? (
            <>
              <div className="border-2 border-border rounded-md p-4 bg-white dark:bg-muted/20 min-h-[150px] flex items-center justify-center">
                <img 
                  src={clientSignature} 
                  alt="Client signature" 
                  className="max-h-[120px] max-w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {clientName || 'Unknown'}
                </p>
              </div>
            </>
          ) : (
            <div className="border-2 border-dashed border-border rounded-md p-4 min-h-[150px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No signature recorded</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
