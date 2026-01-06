import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Edit, Trash2, RefreshCw, Bot, User } from "lucide-react";
import { logAuditAction } from "@/lib/measured/auditLog";

interface Fact {
  id: string;
  title: string;
  clue_text: string;
  reveal_blurb: string;
  canonical_value_int: number;
  unit_label: string;
  category: string;
  source_1: string;
  source_2: string | null;
  status: string;
  times_used: number;
  last_used_date: string | null;
  is_auto_ingested: boolean;
  created_at: string;
}

const CATEGORIES = ["Geography", "Astronomy", "Science", "Culture", "Anatomy", "Sports", "History"];
const STATUSES = ["draft", "verified", "retired"];

const emptyFact = {
  title: "",
  clue_text: "",
  reveal_blurb: "",
  canonical_value_int: 0,
  unit_label: "",
  category: "Geography",
  source_1: "",
  source_2: "",
  status: "draft",
};

export default function MeasuredFactBank() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingFact, setEditingFact] = useState<Partial<Fact> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFacts();
  }, [categoryFilter, statusFilter]);

  const loadFacts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("measured_fact_bank")
        .select("*")
        .order("created_at", { ascending: false });

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFacts(data || []);
    } catch (err) {
      console.error("Error loading facts:", err);
      toast({ title: "Error loading facts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingFact({ ...emptyFact });
    setIsDialogOpen(true);
  };

  const openEditDialog = (fact: Fact) => {
    setEditingFact({ ...fact });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingFact) return;

    setSaving(true);
    try {
      const isNew = !editingFact.id;

      if (isNew) {
        const { error } = await supabase.from("measured_fact_bank").insert({
          title: editingFact.title,
          clue_text: editingFact.clue_text,
          reveal_blurb: editingFact.reveal_blurb,
          canonical_value_int: editingFact.canonical_value_int,
          unit_label: editingFact.unit_label,
          category: editingFact.category,
          source_1: editingFact.source_1 || "",
          source_2: editingFact.source_2 || null,
          status: editingFact.status,
          is_auto_ingested: false,
        });

        if (error) throw error;

        await logAuditAction({
          action: "create_fact",
          entity_type: "fact",
          details: {
            title: editingFact.title,
            category: editingFact.category,
          },
        });

        toast({ title: "Fact created successfully" });
      } else {
        const { error } = await supabase
          .from("measured_fact_bank")
          .update({
            title: editingFact.title,
            clue_text: editingFact.clue_text,
            reveal_blurb: editingFact.reveal_blurb,
            canonical_value_int: editingFact.canonical_value_int,
            unit_label: editingFact.unit_label,
            category: editingFact.category,
            source_1: editingFact.source_1,
            source_2: editingFact.source_2 || null,
            status: editingFact.status,
          })
          .eq("id", editingFact.id);

        if (error) throw error;

        await logAuditAction({
          action: "edit_fact",
          entity_type: "fact",
          entity_id: editingFact.id,
          details: {
            title: editingFact.title,
          },
        });

        toast({ title: "Fact updated successfully" });
      }

      setIsDialogOpen(false);
      setEditingFact(null);
      loadFacts();
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Failed to save fact", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRetire = async (fact: Fact) => {
    try {
      const { error } = await supabase
        .from("measured_fact_bank")
        .update({ status: "retired" })
        .eq("id", fact.id);

      if (error) throw error;

      await logAuditAction({
        action: "retire_fact",
        entity_type: "fact",
        entity_id: fact.id,
        details: {
          title: fact.title,
        },
      });

      toast({ title: "Fact retired" });
      loadFacts();
    } catch (err) {
      console.error("Retire error:", err);
      toast({ title: "Failed to retire fact", variant: "destructive" });
    }
  };

  const filteredFacts = facts.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.clue_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-500/20 text-green-500">Verified</Badge>;
      case "retired": return <Badge className="bg-gray-500/20 text-gray-500">Retired</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Measured Fact Bank</h1>
          <p className="text-muted-foreground mt-1">
            Manage verified facts for daily puzzles
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fact
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{facts.length}</div>
            <p className="text-xs text-muted-foreground">Total Facts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{facts.filter(f => f.status === "verified").length}</div>
            <p className="text-xs text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{facts.filter(f => f.is_auto_ingested).length}</div>
            <p className="text-xs text-muted-foreground">Auto-Ingested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{facts.filter(f => f.times_used === 0).length}</div>
            <p className="text-xs text-muted-foreground">Never Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search facts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
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
            <Button variant="outline" onClick={loadFacts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Facts List */}
      <Card>
        <CardHeader>
          <CardTitle>Facts ({filteredFacts.length})</CardTitle>
          <CardDescription>All verified and draft facts available for puzzles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No facts found. Add a new fact or run ingestion.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{fact.title}</span>
                      <Badge variant="outline">{fact.category}</Badge>
                      {getStatusBadge(fact.status)}
                      {fact.is_auto_ingested ? (
                        <Badge variant="secondary" className="gap-1">
                          <Bot className="h-3 w-3" />
                          Auto
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <User className="h-3 w-3" />
                          Manual
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{fact.clue_text}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Value: <strong>{fact.canonical_value_int.toLocaleString()}</strong> {fact.unit_label}</span>
                      <span>Used: {fact.times_used}x</span>
                      {fact.last_used_date && (
                        <span>Last: {new Date(fact.last_used_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(fact)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {fact.status !== "retired" && (
                      <Button size="sm" variant="ghost" onClick={() => handleRetire(fact)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFact?.id ? "Edit Fact" : "Create New Fact"}</DialogTitle>
          </DialogHeader>
          {editingFact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editingFact.title || ""}
                    onChange={(e) => setEditingFact({ ...editingFact, title: e.target.value })}
                    placeholder="e.g., Mount Everest"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingFact.category}
                    onValueChange={(v) => setEditingFact({ ...editingFact, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Clue Text</Label>
                <Textarea
                  value={editingFact.clue_text || ""}
                  onChange={(e) => setEditingFact({ ...editingFact, clue_text: e.target.value })}
                  placeholder="The elevation of Mount Everest in meters, rounded to the nearest 10."
                />
              </div>

              <div className="space-y-2">
                <Label>Reveal Blurb</Label>
                <Textarea
                  value={editingFact.reveal_blurb || ""}
                  onChange={(e) => setEditingFact({ ...editingFact, reveal_blurb: e.target.value })}
                  placeholder="Mount Everest has an elevation of 8,849 meters."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Target Value (Integer)</Label>
                  <Input
                    type="number"
                    value={editingFact.canonical_value_int || 0}
                    onChange={(e) => setEditingFact({ ...editingFact, canonical_value_int: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Label</Label>
                  <Input
                    value={editingFact.unit_label || ""}
                    onChange={(e) => setEditingFact({ ...editingFact, unit_label: e.target.value })}
                    placeholder="meters"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingFact.status}
                    onValueChange={(v) => setEditingFact({ ...editingFact, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source 1 (URL)</Label>
                  <Input
                    value={editingFact.source_1 || ""}
                    onChange={(e) => setEditingFact({ ...editingFact, source_1: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source 2 (Optional)</Label>
                  <Input
                    value={editingFact.source_2 || ""}
                    onChange={(e) => setEditingFact({ ...editingFact, source_2: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
