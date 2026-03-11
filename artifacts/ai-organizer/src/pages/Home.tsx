import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  Lightbulb,
  ListTodo,
  Plus,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Zap,
} from "lucide-react";

const tasks = [
  { id: 1, title: "Review Q2 marketing strategy", priority: "high", done: false, due: "Today", tags: ["Marketing", "Strategy"] },
  { id: 2, title: "Send project proposal to client", priority: "high", done: false, due: "Today", tags: ["Client", "Sales"] },
  { id: 3, title: "Update team on sprint progress", priority: "medium", done: true, due: "Yesterday", tags: ["Team"] },
  { id: 4, title: "Prepare slides for board meeting", priority: "medium", done: false, due: "Tomorrow", tags: ["Presentation"] },
  { id: 5, title: "Review pull requests from dev team", priority: "low", done: false, due: "This week", tags: ["Dev"] },
];

const suggestions = [
  { icon: Lightbulb, text: "Block 2 hours for deep work on the project proposal — your focus peaks in the morning.", color: "text-yellow-500" },
  { icon: Zap, text: "3 overdue items detected. AI recommends reschedule or delegate the lowest-priority ones.", color: "text-blue-500" },
  { icon: TrendingUp, text: "You completed 78% of tasks last week — 12% above your monthly average. Great momentum!", color: "text-green-500" },
];

const upcomingEvents = [
  { time: "9:00 AM", title: "Team Standup", type: "meeting" },
  { time: "11:00 AM", title: "Client Demo Call", type: "call" },
  { time: "2:00 PM", title: "Focus Block: Proposal", type: "focus" },
  { time: "4:30 PM", title: "Design Review", type: "meeting" },
];

const priorityColor = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const eventTypeColor = {
  meeting: "bg-primary/10 text-primary border-l-4 border-primary",
  call: "bg-blue-500/10 text-blue-600 border-l-4 border-blue-500",
  focus: "bg-green-500/10 text-green-600 border-l-4 border-green-500",
};

export default function Home() {
  const [taskList, setTaskList] = useState(tasks);
  const completedCount = taskList.filter((t) => t.done).length;
  const progress = Math.round((completedCount / taskList.length) * 100);

  const toggleTask = (id: number) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">AI Organizer</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              <Sparkles className="mr-1 h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Tasks</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Calendar</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Notes</a>
          </nav>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Good morning, Alex 👋</h1>
          <p className="mt-1 text-muted-foreground">
            You have <span className="font-medium text-foreground">{taskList.filter((t) => !t.done).length} tasks</span> remaining today. Let's get organized.
          </p>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Tasks Today", value: taskList.length, icon: ListTodo, color: "text-primary" },
            { label: "Completed", value: completedCount, icon: CheckSquare, color: "text-green-500" },
            { label: "In Progress", value: taskList.filter((t) => !t.done).length, icon: Clock, color: "text-yellow-500" },
            { label: "AI Suggestions", value: suggestions.length, icon: Sparkles, color: "text-blue-500" },
          ].map((stat) => (
            <Card key={stat.label} className="border border-border shadow-xs">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-lg bg-muted p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tasks Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Today's Tasks */}
            <Card className="border border-border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListTodo className="h-4 w-4 text-primary" />
                    Today's Tasks
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{completedCount}/{taskList.length}</span>
                    <Progress value={progress} className="w-24" />
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {taskList.map((task) => (
                    <li
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        task.done
                          ? "border-green-500 bg-green-500"
                          : "border-border bg-background"
                      }`}>
                        {task.done && (
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority as keyof typeof priorityColor]}`}>
                            {task.priority}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {task.due}
                          </span>
                          {task.tags.map((tag) => (
                            <span key={tag} className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Tag className="h-3 w-3" />{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" className="mt-4 w-full gap-2 text-muted-foreground">
                  <Plus className="h-4 w-4" /> Add new task
                </Button>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card className="border border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-3 pt-4">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <s.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${s.color}`} />
                    <p className="text-sm text-foreground">{s.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card className="border border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-2 pt-4">
                {upcomingEvents.map((event, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-sm ${eventTypeColor[event.type as keyof typeof eventTypeColor]}`}
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs opacity-75">
                      <Clock className="h-3 w-3" /> {event.time}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Notes */}
            <Card className="border border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Quick Notes
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {[
                    { title: "Meeting notes — Q2 planning", starred: true },
                    { title: "Ideas for new feature rollout", starred: false },
                    { title: "Client feedback summary", starred: true },
                  ].map((note, i) => (
                    <div
                      key={i}
                      className="flex cursor-pointer items-center justify-between rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{note.title}</span>
                      </div>
                      {note.starred && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full gap-2 text-muted-foreground">
                  <Plus className="h-4 w-4" /> New note
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
