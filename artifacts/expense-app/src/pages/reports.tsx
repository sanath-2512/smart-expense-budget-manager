import { useState } from "react";
import { 
  useListReports, 
  getListReportsQueryKey,
  useGenerateReport,
  useGetReport,
  getGetReportQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Plus, Download, FileText, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { GenerateReportBodyType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePreferences } from "@/hooks/use-preferences";

const reportSchema = z.object({
  type: z.nativeEnum(GenerateReportBodyType),
  periodDate: z.string().min(1, "Period is required"),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function Reports() {
  const { formatCurrency } = usePreferences();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const { data: reports, isLoading } = useListReports();
  const generateReport = useGenerateReport();
  
  const { data: selectedReportData, isLoading: isLoadingReportDetails } = useGetReport(
    selectedReportId as number, 
    { query: { enabled: !!selectedReportId, queryKey: getGetReportQueryKey(selectedReportId as number) } }
  );

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: GenerateReportBodyType.monthly,
      periodDate: format(new Date(), "yyyy-MM"),
    },
  });

  const onSubmit = async (data: ReportFormValues) => {
    try {
      let period = data.periodDate;
      if (data.type === GenerateReportBodyType.yearly) {
        period = period.substring(0, 4);
      }
      
      const result = await generateReport.mutateAsync({ 
        data: {
          type: data.type,
          period
        } 
      });
      queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
      toast({ title: "Report generated successfully" });
      setIsAddOpen(false);
      form.reset();
      setSelectedReportId(result.id);
    } catch (error: any) {
      toast({
        title: "Error generating report",
        description: error?.data?.error || "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  if (isLoading && !reports) {
    return <Spinner className="m-auto mt-20 w-8 h-8" />;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">Generate and view detailed spending analysis.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generate Report</DialogTitle>
              <DialogDescription>
                Select the type and period for your new spending report.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={GenerateReportBodyType.monthly}>Monthly</SelectItem>
                          <SelectItem value={GenerateReportBodyType.yearly}>Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="periodDate"
                  render={({ field }) => {
                    const type = form.watch("type");
                    return (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <FormControl>
                          <Input 
                            type={type === GenerateReportBodyType.monthly ? "month" : "number"} 
                            placeholder={type === GenerateReportBodyType.yearly ? "YYYY" : ""}
                            min={type === GenerateReportBodyType.yearly ? 2000 : undefined}
                            max={type === GenerateReportBodyType.yearly ? 2100 : undefined}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <DialogFooter>
                  <Button type="submit" disabled={generateReport.isPending}>
                    {generateReport.isPending ? "Generating..." : "Generate"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports?.map((report) => (
          <Card 
            key={report.id} 
            className="cursor-pointer hover:border-primary transition-colors group"
            onClick={() => setSelectedReportId(report.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <FileText className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <CardTitle className="mt-4 capitalize">{report.type} Report</CardTitle>
              <CardDescription>
                {report.period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Generated {format(new Date(report.generatedAt), "MMM d, yyyy")}
              </p>
            </CardContent>
          </Card>
        ))}
        
        {(!reports || reports.length === 0) && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg bg-muted/20">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No reports generated</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Generate monthly or yearly reports to get deep insights into your spending habits.
            </p>
          </div>
        )}
      </div>

      <Sheet open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl overflow-y-auto">
          {isLoadingReportDetails ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="w-8 h-8" />
            </div>
          ) : selectedReportData ? (
            <div className="space-y-8 pb-10">
              <SheetHeader>
                <SheetTitle className="text-2xl capitalize">{selectedReportData.type} Report - {selectedReportData.period}</SheetTitle>
                <SheetDescription>
                  Generated on {format(new Date(selectedReportData.generatedAt), "MMMM d, yyyy")}
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(selectedReportData.totalExpenses)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{selectedReportData.totalTransactions}</div>
                  </CardContent>
                </Card>
              </div>

              {selectedReportData.monthlyBreakdown && selectedReportData.monthlyBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedReportData.monthlyBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="month" 
                            tickFormatter={(val) => format(parseISO(val + "-01"), "MMM")} 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatCurrency(Number(value))}
                          />
                          <RechartsTooltip 
                            formatter={(value: number) => [formatCurrency(value), "Spent"]}
                            cursor={{ fill: 'hsl(var(--muted))' }}
                          />
                          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedReportData.byCategory && selectedReportData.byCategory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>By Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="w-full md:w-1/2 h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={selectedReportData.byCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="total"
                              nameKey="categoryName"
                            >
                              {selectedReportData.byCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.categoryColor || "hsl(var(--primary))"} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full md:w-1/2 space-y-4">
                        {selectedReportData.byCategory.map((cat) => (
                          <div key={cat.categoryId || "uncategorized"} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.categoryColor || "hsl(var(--muted))" }} />
                                <span className="font-medium">{cat.categoryName}</span>
                              </div>
                              <span className="font-bold">{formatCurrency(cat.total)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{cat.count} transactions</span>
                              <span>{cat.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
