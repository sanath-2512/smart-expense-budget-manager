import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useListBudgets, 
  getListBudgetsQueryKey,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, PieChart as PieChartIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { BudgetPeriod, CreateBudgetBodyPeriod, UpdateBudgetBodyPeriod } from "@workspace/api-client-react";
import { usePreferences } from "@/hooks/use-preferences";

const budgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  limit: z.coerce.number().positive("Limit must be positive"),
  period: z.nativeEnum(CreateBudgetBodyPeriod),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function Budgets() {
  const { formatCurrency } = usePreferences();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  const { data: budgets, isLoading } = useListBudgets();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      limit: 0,
      period: CreateBudgetBodyPeriod.monthly,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: null,
    },
  });

  const onSubmit = async (data: BudgetFormValues) => {
    try {
      if (editingBudget) {
        await updateBudget.mutateAsync({ id: editingBudget.id, data });
        toast({ title: "Budget updated" });
      } else {
        await createBudget.mutateAsync({ data });
        toast({ title: "Budget created" });
      }
      queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
      setIsAddOpen(false);
      setEditingBudget(null);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to save budget",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBudget.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
      toast({ title: "Budget deleted" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      });
    }
  };

  const openEdit = (budget: any) => {
    setEditingBudget(budget);
    form.reset({
      name: budget.name,
      limit: budget.limit,
      period: budget.period as CreateBudgetBodyPeriod,
      startDate: budget.startDate.split("T")[0],
      endDate: budget.endDate ? budget.endDate.split("T")[0] : null,
    });
    setIsAddOpen(true);
  };

  if (isLoading && !budgets) {
    return <Spinner className="m-auto mt-20 w-8 h-8" />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground mt-2">Set limits and monitor your spending goals.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingBudget(null);
            form.reset({
              name: "",
              limit: 0,
              period: CreateBudgetBodyPeriod.monthly,
              startDate: format(new Date(), "yyyy-MM-dd"),
              endDate: null,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBudget ? "Edit Budget" : "Create Budget"}</DialogTitle>
              <DialogDescription>
                {editingBudget ? "Update your budget parameters." : "Define a new spending limit."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Groceries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limit Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CreateBudgetBodyPeriod).map((period) => (
                            <SelectItem key={period} value={period}>
                              {period.charAt(0).toUpperCase() + period.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createBudget.isPending || updateBudget.isPending}>
                    {editingBudget ? "Save changes" : "Create budget"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets?.map((budget) => {
          const isOver = budget.percentUsed > 100;
          const isWarning = budget.percentUsed >= 80 && !isOver;
          return (
            <Card key={budget.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>{budget.name}</CardTitle>
                  <CardDescription className="capitalize">{budget.period}</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(budget)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the budget.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(budget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end mt-4">
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <span className="text-2xl font-bold">{formatCurrency(budget.spent)}</span>
                    <span className="text-muted-foreground text-sm ml-1">/ {formatCurrency(budget.limit)}</span>
                  </div>
                  <span className={`text-sm font-medium ${isOver ? "text-destructive" : isWarning ? "text-amber-500" : "text-muted-foreground"}`}>
                    {budget.percentUsed.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(budget.percentUsed, 100)} 
                  className={`h-2 ${isOver ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary"}`}
                />
                <div className="mt-4 text-xs text-muted-foreground flex justify-between">
                  <span>Remaining: {formatCurrency(budget.remaining < 0 ? 0 : budget.remaining)}</span>
                  <span>{isOver ? "Over budget" : "On track"}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!budgets || budgets.length === 0) && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg">
            <PieChartIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No budgets yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              Create your first budget to start tracking your spending goals and stay on top of your finances.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>Create Budget</Button>
          </div>
        )}
      </div>
    </div>
  );
}
