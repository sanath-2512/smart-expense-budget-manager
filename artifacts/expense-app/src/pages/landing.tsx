import { Link } from "wouter";
import { ArrowRight, BarChart3, Bell, CheckCircle2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Live Spend Intelligence",
    description:
      "See trends, category drift, and budget pressure in real time with a dashboard built for daily decisions.",
    icon: BarChart3,
  },
  {
    title: "Smart Notifications",
    description:
      "Get alerts before overspending, not after. Fine-grained reminders help you stay in control month after month.",
    icon: Bell,
  },
  {
    title: "Secure by Design",
    description:
      "Modern auth, isolated user data, and auditable flows keep your personal finance data private and protected.",
    icon: ShieldCheck,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </div>
            <span>FinTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute right-[-8rem] top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          </div>

          <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:items-center md:pt-24">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Built for modern personal finance workflows
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Control cash flow with a product that feels like your CFO.
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
                FinTrack combines budgeting, expense tracking, reporting, and smart alerts in one clean workspace.
                Fast enough for daily usage, clear enough for long-term planning.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign in
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  No card required
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Setup in minutes
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Works with INR/USD
                </div>
              </div>
            </div>

            <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base">This Month Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Budget Utilization</div>
                  <div className="mt-2 text-3xl font-semibold">67.4%</div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div className="h-2 w-2/3 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">Spent</div>
                    <div className="mt-1 text-lg font-medium">₹58,240</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">Remaining</div>
                    <div className="mt-1 text-lg font-medium">₹28,160</div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-muted-foreground">Top Category</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-medium">Food & Dining</span>
                    <span className="text-sm text-muted-foreground">31%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/60">
                <CardHeader>
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{feature.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
