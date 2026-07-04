import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Building2, Calendar, MessageSquare, Tag, Users } from 'lucide-react';

interface ContactEnquiry {
  id: string;
  name: string;
  firm: string | null;
  email: string;
  phone: string | null;
  message: string;
  plan_context: string | null;
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

export default function AdminContacts() {
  const { data: enquiries = [], isLoading } = useQuery<ContactEnquiry[]>({
    queryKey: ['admin-contact-enquiries'],
    queryFn: async () => {
      const res = await adminApi.getContactEnquiries();
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contact Enquiries</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Submissions from the public contact form — includes plan interest and message
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Users className="w-4 h-4 mr-2" />
          {enquiries.length} total
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading enquiries...</div>
      ) : enquiries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No contact enquiries yet. Submissions from the Contact page will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {enquiries.map((enq) => (
            <Card key={enq.id} className="border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">{enq.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <a href={`mailto:${enq.email}`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {enq.email}
                        </a>
                      </span>
                      {enq.phone && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          <a href={`tel:${enq.phone}`} className="font-medium text-foreground hover:text-primary transition-colors">
                            {enq.phone}
                          </a>
                        </span>
                      )}
                      {enq.firm && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium text-foreground">{enq.firm}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(enq.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {enq.plan_context && (
                  <div className="flex items-center gap-2 rounded-md bg-primary/8 border border-primary/20 px-3 py-2">
                    <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-primary">{enq.plan_context}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                  <p className="leading-relaxed whitespace-pre-wrap">{enq.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
