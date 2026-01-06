import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, CheckCircle, XCircle, AlertTriangle, RefreshCw, Search, Filter } from "lucide-react";
import { logAuditAction } from "@/lib/measured/auditLog";

interface FactCandidate {
  id: string;
  source_name: string;
  source_entity_id: string | null;
  source_property_id: string | null;
  raw_value: number;
  raw_unit: string | null;
  normalized_value_int: number;
  unit_label: string;
  category: string;
  title: string;
  clue_text: string;
  reveal_blurb: string;
  sources: { url: string; name: string }[];
  reference_count: number;
  confidence_score: number;
  sanity_flags: string[];
  status: string;
  created_at: string;
}

const CATEGORIES = ["Geography", "Astronomy", "Science", "Culture", "Anatomy", "Sports"];
const STATUSES = ["new", "needs_review", "approved", "blocked"];

export default function MeasuredIntake() {
  const [candidates, setCandidates] = useState<FactCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadCandidates();
  }, [categoryFilter, statusFilter, confidenceFilter]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("measured_fact_candidates")
        .select("*")
        .order("confidence_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (confidenceFilter === "high") {
        query = query.gte("confidence_score", 0.85);
      } else if (confidenceFilter === "medium") {
        query = query.gte("confidence_score", 0.6).lt("confidence_score", 0.85);
      } else if (confidenceFilter === "low") {
        query = query.lt("confidence_score", 0.6);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCandidates((data || []) as FactCandidate[]);
    } catch (err) {
      console.error("Error loading candidates:", err);
      toast({ title: "Error loading candidates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const triggerIngestion = async () => {
    setIngesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-measured-facts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ limit: 30 }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ingestion failed");
      }

      toast({
        title: "Ingestion complete",
        description: `Inserted ${result.inserted} new candidates, skipped ${result.skipped} duplicates.`,
      });

      loadCandidates();
    } catch (err) {
      console.error("Ingestion error:", err);
      toast({
        title: "Ingestion failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIngesting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const batchUpdateStatus = async (newStatus: string) => {
    if (selectedIds.size === 0) return;

    try {
      const ids = Array.from(selectedIds);

      if (newStatus === "approved") {
        // Move to fact bank
        const candidatesToApprove = candidates.filter(c => ids.includes(c.id));
        
        for (const candidate of candidatesToApprove) {
          // Insert into fact bank
          const { error: insertError } = await supabase
            .from("measured_fact_bank")
            .insert({
              title: candidate.title,
              clue_text: candidate.clue_text,
              reveal_blurb: candidate.reveal_blurb,
              canonical_value_int: candidate.normalized_value_int,
              unit_label: candidate.unit_label,
              category: candidate.category,
              source_1: candidate.sources[0]?.url || "",
              source_candidate_id: candidate.id,
              is_auto_ingested: true,
              status: "verified",
            });

          if (insertError) {
            console.error("Error inserting fact:", insertError);
            continue;
          }

          // Update candidate status
          await supabase
            .from("measured_fact_candidates")
            .update({ status: "approved", reviewed_at: new Date().toISOString() })
            .eq("id", candidate.id);

          await logAuditAction("approve_candidate", "candidate", candidate.id, {
            title: candidate.title,
            category: candidate.category,
          });
        }

        toast({ title: `Approved ${candidatesToApprove.length} candidates and added to Fact Bank` });
      } else {
        // Just update status
        const { error } = await supabase
          .from("measured_fact_candidates")
          .update({ status: newStatus, reviewed_at: new Date().toISOString() })
          .in("id", ids);

        if (error) throw error;

        for (const id of ids) {
          await logAuditAction(
            newStatus === "blocked" ? "block_candidate" : "update_candidate",
            "candidate",
            id,
            { newStatus }
          );
        }

        toast({ title: `Updated ${ids.length} candidates to ${newStatus}` });
      }

      setSelectedIds(new Set());
      loadCandidates();
    } catch (err) {
      console.error("Batch update error:", err);
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const filteredCandidates = candidates.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clue_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.85) return <Badge className="bg-green-500/20 text-green-500">High ({Math.round(score * 100)}%)</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-500/20 text-yellow-500">Medium ({Math.round(score * 100)}%)</Badge>;
    return <Badge className="bg-red-500/20 text-red-500">Low ({Math.round(score * 100)}%)</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/20 text-green-500">Approved</Badge>;
      case "blocked": return <Badge className="bg-red-500/20 text-red-500">Blocked</Badge>;
      case "needs_review": return <Badge className="bg-blue-500/20 text-blue-500">Needs Review</Badge>;
      default: return <Badge variant="secondary">New</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto Fact Intake</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve automatically ingested fact candidates
          </p>
        </div>
        <Button onClick={triggerIngestion} disabled={ingesting}>
          {ingesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ingesting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Run Ingestion
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="high">High (≥85%)</SelectItem>
                <SelectItem value="medium">Medium (60-84%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadCandidates}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button size="sm" onClick={() => batchUpdateStatus("approved")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={() => batchUpdateStatus("blocked")}>
                <XCircle className="mr-2 h-4 w-4" />
                Block Selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Candidates ({filteredCandidates.length})</CardTitle>
              <CardDescription>Review and approve fact candidates</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No candidates found. Run ingestion to fetch new facts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(candidate.id)}
                    onCheckedChange={(checked) => handleSelectOne(candidate.id, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{candidate.title}</span>
                      <Badge variant="outline">{candidate.category}</Badge>
                      {getStatusBadge(candidate.status)}
                      {getConfidenceBadge(candidate.confidence_score)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{candidate.clue_text}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Target: <strong>{candidate.normalized_value_int.toLocaleString()}</strong> {candidate.unit_label}</span>
                      <span>Source: {candidate.source_name}</span>
                      {candidate.sanity_flags.length > 0 && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <AlertTriangle className="h-3 w-3" />
                          {candidate.sanity_flags.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
