import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Ban, CheckCircle, AlertCircle } from "lucide-react";
import { z } from "zod";
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
  const [filter, setFilter] = useState<"all" | "banned" | "complained" | "unused">("all");
  const [populateLoading, setPopulateLoading] = useState(false);
  const { toast } = useToast();

  const searchSchema = z.object({
    term: z.string()
      .min(2, "Search term must be at least 2 characters")
      .max(50, "Search term must be less than 50 characters")
      .regex(/^[a-zA-Z]+$/, "Search term must contain only letters")
  });

  const searchWords = async () => {
    if (searchTerm) {
      const validation = searchSchema.safeParse({ term: searchTerm });
      if (!validation.success) {
        toast({
          title: "Invalid search",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      let query = supabase
        .from("admin_dictionary")
        .select("*");

      // Apply search filter
      if (searchTerm) {
        query = query.ilike("word", `${searchTerm}%`);
      }

      // Apply category filter
      if (filter === "banned") {
        query = query.eq("is_banned", true);
      } else if (filter === "complained") {
        query = query.gt("complaint_count", 0);
      } else if (filter === "unused") {
        query = query.is("last_seen", null);
      }

      const { data, error } = await query
        .order("complaint_count", { ascending: false, nullsFirst: false })
        .order("word")
        .limit(100);

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

  const populateDictionary = async () => {
    setPopulateLoading(true);
    try {
      // Import puzzle data
      const { CURATED_4L_PUZZLES } = await import("@/lib/curatedPuzzles4L");
      const { CURATED_5L_PUZZLES } = await import("@/lib/curatedPuzzles5L");
      const { CURATED_6L_PUZZLES } = await import("@/lib/curatedPuzzles6L");

      const allPuzzles = [
        ...CURATED_4L_PUZZLES,
        ...CURATED_5L_PUZZLES,
        ...CURATED_6L_PUZZLES,
      ];

      const { data, error } = await supabase.functions.invoke('populate-dictionary', {
        body: { puzzles: allPuzzles }
      });

      if (error) throw error;

      toast({
        title: "Dictionary populated",
        description: `${data.inserted} words inserted, ${data.skipped} skipped`,
      });

      searchWords();
    } catch (error: any) {
      toast({
        title: "Error populating dictionary",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPopulateLoading(false);
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Word Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                >
                  All Words
                </Button>
                <Button
                  size="sm"
                  variant={filter === "banned" ? "default" : "outline"}
                  onClick={() => setFilter("banned")}
                >
                  Banned
                </Button>
                <Button
                  size="sm"
                  variant={filter === "complained" ? "default" : "outline"}
                  onClick={() => setFilter("complained")}
                >
                  Complaints
                </Button>
                <Button
                  size="sm"
                  variant={filter === "unused" ? "default" : "outline"}
                  onClick={() => setFilter("unused")}
                >
                  Unused
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={populateDictionary}
              disabled={populateLoading}
              className="w-full"
            >
              {populateLoading ? "Populating..." : "Populate from Puzzle Lists"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Imports all words from curated puzzle lists into the dictionary
            </p>
          </CardContent>
        </Card>
      </div>

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
