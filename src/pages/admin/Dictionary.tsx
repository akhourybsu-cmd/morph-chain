import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Ban, CheckCircle, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dictionary() {
  const [words, setWords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchWords = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      toast({
        title: "Invalid search",
        description: "Please enter at least 2 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_dictionary")
        .select("*")
        .ilike("word", `${searchTerm}%`)
        .order("word")
        .limit(50);

      if (error) throw error;
      setWords(data || []);
    } catch (error: any) {
      toast({
        title: "Error searching words",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (wordId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("admin_dictionary")
        .update({ 
          is_banned: !currentStatus,
          ban_reason: !currentStatus ? "Admin action" : null 
        })
        .eq("id", wordId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Word unbanned" : "Word banned",
        description: "Dictionary updated successfully",
      });

      searchWords();
    } catch (error: any) {
      toast({
        title: "Error updating word",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dictionary Manager</h1>
        <p className="text-muted-foreground">Search and manage allowed/banned words</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Word Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchWords()}
                className="pl-10"
              />
            </div>
            <Button onClick={searchWords} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {words.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({words.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Complaints</TableHead>
                  <TableHead>First/Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell className="font-mono font-semibold uppercase">
                      {word.word}
                    </TableCell>
                    <TableCell>{word.word_length}</TableCell>
                    <TableCell>
                      {word.is_banned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Allowed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{word.frequency_score || "—"}</TableCell>
                    <TableCell>
                      {word.complaint_count > 0 ? (
                        <Badge variant="outline" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {word.complaint_count}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {word.first_seen ? `${word.first_seen} / ${word.last_seen || "—"}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={word.is_banned ? "outline" : "destructive"}
                        onClick={() => toggleBan(word.id, word.is_banned)}
                      >
                        {word.is_banned ? "Unban" : "Ban"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
