import { useState, useCallback } from 'react';
import { subDays, startOfDay, endOfDay, format, differenceInDays } from 'date-fns';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
    Users, Eye, MonitorSmartphone, LogIn,
    TrendingUp, TrendingDown, CalendarIcon, Minus,
    BarChart3, Globe
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

import { useVisitorAnalytics } from '@/hooks/useVisitorAnalytics';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DateRange { from: Date; to: Date }

type Preset = {
    label: string;
    shortLabel: string;
    range: () => DateRange;
};

// ─── Preset Definitions ─────────────────────────────────────────────────────

const PRESETS: Preset[] = [
    {
        label: 'Today',
        shortLabel: 'Today',
        range: () => ({ from: startOfDay(new Date()), to: new Date() }),
    },
    {
        label: 'Last 3 days',
        shortLabel: '3d',
        range: () => ({ from: startOfDay(subDays(new Date(), 2)), to: new Date() }),
    },
    {
        label: 'Last 7 days',
        shortLabel: '7d',
        range: () => ({ from: startOfDay(subDays(new Date(), 6)), to: new Date() }),
    },
    {
        label: 'Last 14 days',
        shortLabel: '14d',
        range: () => ({ from: startOfDay(subDays(new Date(), 13)), to: new Date() }),
    },
    {
        label: 'Last 30 days',
        shortLabel: '30d',
        range: () => ({ from: startOfDay(subDays(new Date(), 29)), to: new Date() }),
    },
    {
        label: 'Last 90 days',
        shortLabel: '90d',
        range: () => ({ from: startOfDay(subDays(new Date(), 89)), to: new Date() }),
    },
    {
        label: 'Last 180 days',
        shortLabel: '180d',
        range: () => ({ from: startOfDay(subDays(new Date(), 179)), to: new Date() }),
    },
    {
        label: 'Last 1 year',
        shortLabel: '1y',
        range: () => ({ from: startOfDay(subDays(new Date(), 364)), to: new Date() }),
    },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function ChangeTag({ pct }: { pct: number }) {
    if (pct === 0) return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Minus className="h-3 w-3" /> 0%
        </span>
    );
    if (pct > 0) return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3 w-3" /> +{pct}%
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium">
            <TrendingDown className="h-3 w-3" /> {pct}%
        </span>
    );
}

function KpiCard({
    title,
    value,
    icon: Icon,
    change,
    subtitle,
    loading,
    color,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    change?: number;
    subtitle?: string;
    loading?: boolean;
    color?: string;
}) {
    return (
        <Card className="relative overflow-hidden">
            {/* Subtle gradient accent */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-8 translate-x-8 ${color || 'bg-primary'}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-lg ${color ? color.replace('bg-', 'bg-') + '/10' : 'bg-primary/10'}`}>
                    <Icon className={`h-4 w-4 ${color ? color.replace('bg-', 'text-') : 'text-primary'}`} />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="text-2xl font-bold tracking-tight">{value.toLocaleString()}</div>
                )}
                <div className="mt-1 flex items-center gap-2">
                    {loading ? (
                        <Skeleton className="h-4 w-20" />
                    ) : (
                        <>
                            {change !== undefined && <ChangeTag pct={change} />}
                            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ChartSkeleton() {
    return (
        <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
    );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
            <p className="font-medium mb-1">{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ color: entry.color }}>
                    {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
                </p>
            ))}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function VisitorAnalytics() {
    const [activePreset, setActivePreset] = useState<number>(4); // default: 30d
    const [dateRange, setDateRange] = useState<DateRange>(PRESETS[4].range());
    const [customOpen, setCustomOpen] = useState(false);
    const [customFrom, setCustomFrom] = useState<Date | undefined>();
    const [customTo, setCustomTo] = useState<Date | undefined>();

    const { data, isLoading, isError } = useVisitorAnalytics(dateRange);

    // ── Preset Selection ────────────────────────────────────────────────────
    const selectPreset = useCallback((index: number) => {
        setActivePreset(index);
        setDateRange(PRESETS[index].range());
    }, []);

    // ── Custom Date Apply ───────────────────────────────────────────────────
    const applyCustomRange = useCallback(() => {
        if (!customFrom || !customTo) return;
        setActivePreset(-1);
        setDateRange({ from: startOfDay(customFrom), to: endOfDay(customTo) });
        setCustomOpen(false);
    }, [customFrom, customTo]);

    // ── Derived values ──────────────────────────────────────────────────────
    const stats = data?.stats;
    const daySpan = differenceInDays(dateRange.to, dateRange.from) + 1;

    const rangeLabel = activePreset >= 0
        ? PRESETS[activePreset].label
        : `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`;

    const comparisonLabel = `vs. prev. ${daySpan === 1 ? 'day' : `${daySpan} days`}`;

    // ── Chart data ──────────────────────────────────────────────────────────
    const chartData = (stats?.daily_series ?? []).map(d => ({
        day: format(new Date(d.day), daySpan > 90 ? 'MMM yy' : 'MMM d'),
        'Unique Visitors': d.visitors,
        'Page Views': d.page_views,
    }));

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-7 w-7 text-primary" />
                        Visitor Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor website traffic — {rangeLabel}
                    </p>
                </div>

                {/* ── Date Controls ── */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Preset buttons */}
                    {PRESETS.map((preset, idx) => (
                        <Button
                            key={preset.shortLabel}
                            variant={activePreset === idx ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 px-3 text-xs font-medium"
                            onClick={() => selectPreset(idx)}
                        >
                            {preset.shortLabel}
                        </Button>
                    ))}

                    {/* Custom picker */}
                    <Popover open={customOpen} onOpenChange={setCustomOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={activePreset === -1 ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 px-3 text-xs font-medium gap-1"
                            >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {activePreset === -1
                                    ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
                                    : 'Custom'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5">From</p>
                                        <Calendar
                                            mode="single"
                                            selected={customFrom}
                                            onSelect={setCustomFrom}
                                            disabled={(d) => customTo ? d > customTo : d > new Date()}
                                            initialFocus
                                            className="rounded-md border"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5">To</p>
                                        <Calendar
                                            mode="single"
                                            selected={customTo}
                                            onSelect={setCustomTo}
                                            disabled={(d) => customFrom ? d < customFrom : false}
                                            className="rounded-md border"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setCustomOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={applyCustomRange}
                                        disabled={!customFrom || !customTo}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* ── Error State ── */}
            {isError && (
                <Card className="border-rose-200 bg-rose-50">
                    <CardContent className="p-6 text-center">
                        <Globe className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                        <p className="text-rose-700 font-medium">Could not load analytics data.</p>
                        <p className="text-rose-500 text-sm mt-1">
                            Ensure you have run <code className="font-mono bg-rose-100 px-1 rounded">visitor_analytics_setup.sql</code> in Supabase.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── KPI Cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Unique Visitors"
                    value={stats?.unique_visitors ?? 0}
                    icon={Users}
                    change={data?.visitorChange}
                    subtitle={comparisonLabel}
                    loading={isLoading}
                    color="bg-violet-500"
                />
                <KpiCard
                    title="Total Page Views"
                    value={stats?.total_page_views ?? 0}
                    icon={Eye}
                    change={data?.pageViewChange}
                    subtitle={comparisonLabel}
                    loading={isLoading}
                    color="bg-sky-500"
                />
                <KpiCard
                    title="Logged-in Visitors"
                    value={stats?.logged_in_visitors ?? 0}
                    icon={LogIn}
                    subtitle="Authenticated users"
                    loading={isLoading}
                    color="bg-emerald-500"
                />
                <KpiCard
                    title="Mobile Traffic"
                    value={stats ? `${stats.mobile_pct}%` : '—'}
                    icon={MonitorSmartphone}
                    subtitle={stats ? `${stats.desktop_pct}% desktop` : 'Loading…'}
                    loading={isLoading}
                    color="bg-amber-500"
                />
            </div>

            {/* ── Chart + Top Pages ── */}
            <div className="grid gap-6 lg:grid-cols-5">

                {/* Daily Visitors Chart */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Daily Traffic</CardTitle>
                        <CardDescription>
                            Unique visitors &amp; page views over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <ChartSkeleton />
                        ) : chartData.length === 0 ? (
                            <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <BarChart3 className="h-10 w-10 opacity-30" />
                                <p className="text-sm">No visits recorded in this period yet.</p>
                                <p className="text-xs opacity-70">
                                    Traffic will appear here once visitors browse the site.
                                </p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gPageViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="Unique Visitors"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fill="url(#gVisitors)"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="Page Views"
                                        stroke="#0ea5e9"
                                        strokeWidth={2}
                                        fill="url(#gPageViews)"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}

                        {/* Legend */}
                        {!isLoading && chartData.length > 0 && (
                            <div className="flex items-center gap-4 mt-3 justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                                    Unique Visitors
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                                    Page Views
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Pages */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Top Pages</CardTitle>
                        <CardDescription>Most visited URLs in this period</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        {isLoading ? (
                            <div className="space-y-3 px-6">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-full" />
                                ))}
                            </div>
                        ) : !stats?.top_pages?.length ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                                <Globe className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No pages tracked yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">#</TableHead>
                                        <TableHead>Page</TableHead>
                                        <TableHead className="text-right pr-6">Views</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.top_pages.map((page, idx) => {
                                        const maxViews = stats.top_pages[0]?.views || 1;
                                        const widthPct = Math.max(4, Math.round((page.views / maxViews) * 100));
                                        return (
                                            <TableRow key={page.path}>
                                                <TableCell className="pl-6 text-muted-foreground font-mono text-xs w-8">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="max-w-[140px]">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium truncate">
                                                            {page.path === '/' ? 'Home' : page.path}
                                                        </p>
                                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-violet-400 rounded-full transition-all"
                                                                style={{ width: `${widthPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                                                        {page.views.toLocaleString()}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Summary Footer ── */}
            <Card className="bg-muted/40 border-dashed">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <span>
                            📅 Showing data from <strong className="text-foreground">{format(dateRange.from, 'MMM d, yyyy')}</strong> to{' '}
                            <strong className="text-foreground">{format(dateRange.to, 'MMM d, yyyy')}</strong>
                            {' '}({daySpan} day{daySpan !== 1 ? 's' : ''})
                        </span>
                        <span>•</span>
                        <span>
                            Data updates every 5 minutes. Session-based unique visitor deduplication via{' '}
                            <code className="text-xs bg-background border rounded px-1">session_id</code>.
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
