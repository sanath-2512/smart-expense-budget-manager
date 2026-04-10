import { 
  useGetDashboardSummary, 
  useGetMonthlyTrend, 
  useGetRecentExpenses, 
  useGetSpendingByCategory 
} from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Wallet, TrendingUp, PieChart as PieChartIcon, Bell } from "lucide-react";
import { usePreferences } from "@/hooks/use-preferences";

export default function Dashboard() {
  const { formatCurrency } = usePreferences();
  const currentMonth = format(new Date(), "yyyy-MM");
  
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend();
  const { data: recent, isLoading: isLoadingRecent } = useGetRecentExpenses({ limit: 5 });
  const { data: byCategory, isLoading: isLoadingCategories } = useGetSpendingByCategory({ month: currentMonth });

  const isLoading = isLoadingSummary || isLoadingTrend || isLoadingRecent || isLoadingCategories;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Here's your financial overview for {format(new Date(), "MMMM yyyy")}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalExpensesThisMonth || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              vs {formatCurrency(summary?.totalExpensesLastMonth || 0)} last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.budgetCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary?.totalBudget || 0)} total limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.budgetUsedPercent || 0).toFixed(1)}%</div>
            <Progress value={summary?.budgetUsedPercent || 0} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.unreadNotifications || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unread messages
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Monthly spending trend</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
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
                    labelFormatter={(label) => format(parseISO(label + "-01"), "MMMM yyyy")}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Spending by category this month</CardDescription>
          </CardHeader>
          <CardContent>
            {byCategory && byCategory.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="categoryName"
                    >
                      {byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.categoryColor || "hsl(var(--primary))"} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2 max-h-[100px] overflow-y-auto pr-2">
                  {byCategory.map((cat) => (
                    <div key={cat.categoryId || "uncategorized"} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.categoryColor || "hsl(var(--muted))" }} />
                        <span>{cat.categoryName}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                No spending data for this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your latest transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recent?.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white font-medium"
                    style={{ backgroundColor: expense.categoryColor || "hsl(var(--muted))" }}
                  >
                    {expense.categoryName ? expense.categoryName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{expense.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {expense.categoryName || "Uncategorized"} • {format(new Date(expense.date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="font-medium">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            ))}
            {(!recent || recent.length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-4">
                No recent expenses found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
