import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function KycQueue() {
  // This would use useQuery with adminApi.getKycQueue()
  // Placeholder implementation
  const kycQueue = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Queue</h1>
        <p className="text-muted-foreground">
          Review and approve pending KYC verifications
        </p>
      </div>

      {kycQueue.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">All Clear!</p>
            <p className="text-muted-foreground">
              No pending KYC verifications to review
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* KYC items would be mapped here */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Sample Company</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">PAN: ABCDE1234F</p>
                    <p className="text-muted-foreground">GST: 22AAAAA0000A1Z5</p>
                    <p className="text-muted-foreground">Submitted: {formatDate(new Date())}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                  <Button size="sm" variant="default">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
