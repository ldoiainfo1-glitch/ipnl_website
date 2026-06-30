import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Phone, Mail, Calendar, Users } from 'lucide-react';

interface Lead {
  id: string;
  user_id: string | null;
  name: string;
  mobile: string;
  email: string;
  mandate_title: string;
  mandate_type: string;
  mandate_company: string;
  mandate_asset: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminLeads() {
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const res = await adminApi.getLeads();
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mandate Enquiry Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Users who enquired about a mandate before registering
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Users className="w-4 h-4 mr-2" />
          {leads.length} total
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading leads...</div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No leads yet. When a user clicks "Send Enquiry" on a mandate and registers, they will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{lead.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {lead.email}
                        </span>
                      )}
                      {lead.mobile && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {lead.mobile}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(lead.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/60 dark:bg-[#FF9900]/5 border border-orange-100 dark:border-[#FF9900]/20">
                  <div className="size-9 rounded-full flex items-center justify-center bg-[#003366] text-white dark:bg-[#FF9900] dark:text-[#003366] font-bold text-sm shrink-0">
                    {lead.mandate_company.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{lead.mandate_company}</p>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {lead.mandate_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      <Building2 className="w-3 h-3 inline mr-1" />
                      {lead.mandate_asset}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
