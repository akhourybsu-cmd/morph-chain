import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface WordFeedbackItem {
  id: string;
  word: string;
  word_length: number;
  reason: string;
  status: string;
  user_id: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function WordFeedback() {
  const [feedback, setFeedback] = useState<WordFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("pending");
  const [selectedItem, setSelectedItem] = useState<WordFeedbackItem | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("word_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "reviewed") {
        query = query.neq("status", "pending");
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setFeedback(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string, banWord: boolean = false) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("word_feedback")
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq("id", id);

      if (error) throw error;

      // If we need to ban the word, update the dictionary
      if (banWord && selectedItem) {
        const { error: banError } = await supabase
          .from("admin_dictionary")
          .upsert({
            word: selectedItem.word.toLowerCase(),
            word_length: selectedItem.word_length,
            is_banned: true,
            ban_reason: selectedItem.reason,
            complaint_count: 1
          }, {
            onConflict: 'word'
          });

        if (banError) {
          console.error('Error banning word:', banError);
        }
      }

      toast({
        title: "Feedback updated",
        description: `Status changed to ${newStatus}${banWord ? ' and word banned' : ''}`,
      });

      setSelectedItem(null);
      setAdminNotes("");
      fetchFeedback();
    } catch (error: any) {
      toast({
        title: "Error updating feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openReviewDialog = (item: WordFeedbackItem) => {
    setSelectedItem(item);
    setAdminNotes(item.admin_notes || "");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = feedback.filter(f => f.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Word Feedback</h1>
          <p className="text-muted-foreground">Review player-reported word issues</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {feedback.filter(f => f.status !== "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Feedback Reports</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => setFilter("pending")}
              >
                Pending
              </Button>
              <Button
                size="sm"
                variant={filter === "reviewed" ? "default" : "outline"}
                onClick={() => setFilter("reviewed")}
              >
                Reviewed
              </Button>
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No feedback reports found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-semibold uppercase">
                      {item.word}
                    </TableCell>
                    <TableCell>{item.word_length}L</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.reason}>
                      {item.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReviewDialog(item)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Word Report</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Reported Word</p>
                <p className="font-mono font-bold text-2xl uppercase">{selectedItem.word}</p>
                <Badge variant="outline" className="mt-2">{selectedItem.word_length}-letter</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Player's Reason</p>
                <p className="text-sm p-3 bg-muted/50 rounded-lg">{selectedItem.reason}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                <Textarea
                  placeholder="Add notes about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => updateStatus(selectedItem!.id, "rejected")}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Report
            </Button>
            <Button
              variant="default"
              onClick={() => updateStatus(selectedItem!.id, "approved", true)}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Ban Word
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}