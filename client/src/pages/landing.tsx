import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Key,
  Shield,
  Zap,
  Crown,
  CheckCircle2,
  Star,
  Sparkles,
  Gamepad2,
  Play,
  ChevronLeft,
  ChevronRight,
  Heart,
  Eye,
  Gift,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Showcase, Package, Team } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { HeaderLogo } from "@/components/header-logo";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

function formatIdr(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(String(value).replace(/,/g, "")) || 0 : Number(value);
  return new Intl.NumberFormat("id-ID").format(n);
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Shield,
  Star,
  Sparkles,
  Key,
  Crown,
  Gamepad2,
  CheckCircle2,
};

function getYoutubeId(url: string | null): string {
  if (!url) return "";
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : "";
}

const DISCORD_INVITE = "https://discord.gg/vGT2km9gh";

function MobileCarouselControls({ api }: { api: any }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    const sync = () => {
      setSnapCount(api.scrollSnapList().length);
      setSelectedIndex(api.selectedScrollSnap());
    };

    sync();
    api.on("reInit", sync);
    api.on("select", sync);
    return () => {
      api.off("reInit", sync);
      api.off("select", sync);
    };
  }, [api]);

  if (!api || snapCount <= 1) return null;

  const canPrev = api.canScrollPrev();
  const canNext = api.canScrollNext();

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-full bg-background/70 backdrop-blur"
        onClick={() => api.scrollPrev()}
        disabled={!canPrev}
        aria-label="Sebelumnya"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: snapCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => api.scrollTo(i)}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              i === selectedIndex ? "w-7 bg-primary" : "bg-muted-foreground/35",
            )}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === selectedIndex}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-full bg-background/70 backdrop-blur"
        onClick={() => api.scrollNext()}
        disabled={!canNext}
        aria-label="Berikutnya"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

export default function Landing() {
  const [filterType, setFilterType] = useState<"all" | "free" | "premium">("all");
  const [filterGame, setFilterGame] = useState<string>("all");
  const [videoModal, setVideoModal] = useState<{ id: number; vidId: string } | null>(null);
  const [packagesApi, setPackagesApi] = useState<any>(null);
  const [showcaseApi, setShowcaseApi] = useState<any>(null);

  const { data: showcaseItems = [] } = useQuery<Showcase[]>({
    queryKey: ["/api/showcase"],
    queryFn: async () => {
      const res = await fetch("/api/showcase");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const viewMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/showcase/${id}/view`, { method: "POST" }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed")))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/showcase"] }),
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/showcase/${id}/like`, { method: "POST" }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed")))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/showcase"] }),
  });

  const tipMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/showcase/${id}/tip`, { method: "POST" }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed")))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/showcase"] }),
  });

  const openVideo = (item: Showcase) => {
    const vidId = getYoutubeId(item.youtubeUrl);
    if (vidId) {
      setVideoModal({ id: item.id, vidId });
      viewMutation.mutate(item.id);
    }
  };

  const games = useMemo(() => {
    const set = new Set(showcaseItems.map((s) => s.gameName).filter(Boolean));
    return Array.from(set).sort();
  }, [showcaseItems]);

  const filtered = useMemo(() => {
    return showcaseItems.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterGame !== "all" && item.gameName !== filterGame) return false;
      return true;
    });
  }, [showcaseItems, filterType, filterGame]);

  const { data: packageItems = [] } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
    queryFn: async () => {
      const res = await fetch("/api/packages");
      if (!res.ok) return [];
      return res.json();
    },
  });
  const packageCards = useMemo(() => packageItems.slice(0, 3), [packageItems]);

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background circuit-overlay">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b glass">
        <div className="container flex h-16 items-center justify-between gap-2 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-serif text-xl font-bold tracking-wide">
            <HeaderLogo size="md" />
            KingVypers
          </Link>
          <nav className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <Button variant="outline" size="sm" asChild>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Join Discord
              </a>
            </Button>
            <Link href="/beli">
              <Button variant="default" size="sm">Beli Sekarang</Button>
            </Link>
            <Link href="/validate">
              <Button variant="ghost" size="sm">
                Validate Key
              </Button>
            </Link>
          </nav>
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem>
                  <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="w-full">
                    Join Discord
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/beli" className="w-full">
                    Beli Sekarang
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/validate" className="w-full">
                    Validate Key
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container px-4 py-16 md:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Roblox Script Key System
          </h1>
          <p className="mt-4 md:mt-6 text-base md:text-lg text-muted-foreground">
            Secure license keys with HWID binding. Generate, validate, and manage keys for your script—all in one place.
          </p>
          <div className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <Button size="lg" variant="outline" className="gap-2 text-base" asChild>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Join Discord
              </a>
            </Button>
            <Link href="/beli">
              <Button size="lg" className="gap-2 text-base">
                Beli Sekarang
              </Button>
            </Link>
            <Link href="/validate">
              <Button size="lg" variant="outline" className="gap-2 text-base">
                <Key className="h-5 w-5" />
                Validate My Key
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pilih Paket */}
      {packageCards.length > 0 && (
        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="container px-4">
            <h2 className="font-serif text-3xl font-bold tracking-wide text-center mb-2">Pilih Paket</h2>
            <p className="text-center text-muted-foreground mb-8 md:mb-10">Pilih durasi dan beli key via Discord.</p>
            {/* Mobile carousel */}
            <div className="sm:hidden">
              <Carousel className="relative" setApi={setPackagesApi} opts={{ align: "start" }}>
                <CarouselContent>
                  {packageItems.map((pkg) => {
                    const features = [pkg.feature1, pkg.feature2, pkg.feature3, pkg.feature4].filter(Boolean);
                    return (
                      <CarouselItem key={pkg.id}>
                        <div
                          className={`relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden glass`}
                        >
                          {pkg.isPopular ? (
                            <div className="absolute left-0 right-0 top-0 bg-primary py-1.5 text-center text-xs font-semibold text-primary-foreground">
                              Most Popular
                            </div>
                          ) : null}
                          <div className={pkg.isPopular ? "pt-10" : ""}>
                            <div className="relative">
                              {pkg.imageUrl ? (
                                <div className="aspect-video w-full overflow-hidden bg-muted">
                                  <img src={pkg.imageUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                              ) : (
                                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                                  <span className="text-muted-foreground text-sm">No image</span>
                                </div>
                              )}
                            </div>
                            <div className="p-5 flex flex-1 flex-col">
                              <h3 className="font-semibold text-lg">{pkg.title}</h3>
                              <ul className="mt-3 space-y-1.5 text-sm">
                                {features.map((f, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-4 text-xl font-bold">IDR {formatIdr(pkg.price ?? 0)}</p>
                              <Button className="mt-4 w-full" asChild>
                                <a href={pkg.buyLink} target="_blank" rel="noopener noreferrer">
                                  Beli Sekarang
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
              <MobileCarouselControls api={packagesApi} />
            </div>
            {/* Desktop grid */}
            <div className="hidden sm:grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
              {packageCards.map((pkg) => {
                const features = [pkg.feature1, pkg.feature2, pkg.feature3, pkg.feature4].filter(Boolean);
                return (
                  <div
                    key={pkg.id}
                    className={`relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden glass ${
                      pkg.isPopular ? "ring-2 ring-primary shadow-lg" : ""
                    }`}
                  >
                    {pkg.isPopular ? (
                      <div className="absolute left-0 right-0 top-0 bg-primary py-1.5 text-center text-xs font-semibold text-primary-foreground">
                        Most Popular
                      </div>
                    ) : null}
                    <div className={pkg.isPopular ? "pt-10" : ""}>
                      {pkg.imageUrl ? (
                        <div className="aspect-video w-full overflow-hidden bg-muted">
                          <img src={pkg.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">No image</span>
                        </div>
                      )}
                      <div className="p-5 flex flex-1 flex-col">
                        <h3 className="font-semibold text-lg">{pkg.title}</h3>
                        <ul className="mt-3 space-y-1.5 text-sm">
                          {features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 text-xl font-bold">IDR {formatIdr(pkg.price ?? 0)}</p>
                        <Button className="mt-4 w-full" asChild>
                          <a href={pkg.buyLink} target="_blank" rel="noopener noreferrer">
                            Beli Sekarang
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {packageItems.length > 3 && (
              <div className="mt-8 text-center">
                <Link href="/beli">
                  <Button variant="outline">Lihat semua paket</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Showcase */}
      {showcaseItems.length > 0 && (
        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="container px-4">
            <h2 className="font-serif text-3xl font-bold tracking-wide text-center mb-8">
              Scripts
            </h2>
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Type:</span>
              <div className="flex rounded-lg border bg-background p-1">
                {(["all", "free", "premium"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                      filterType === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {games.length > 0 && (
                <>
                  <span className="ml-4 text-sm font-medium text-muted-foreground">Game:</span>
                  <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-1">
                    <button
                      type="button"
                      onClick={() => setFilterGame("all")}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        filterGame === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      All Games
                    </button>
                    {games.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFilterGame(g)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          filterGame === g ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Mobile carousel */}
            <div className="sm:hidden">
              <Carousel setApi={setShowcaseApi} opts={{ align: "start" }}>
                <CarouselContent>
                  {filtered.map((item) => {
                    const vidId = getYoutubeId(item.youtubeUrl);
                    const Icon1 = ICON_MAP[item.feature1Icon ?? "Zap"] ?? Zap;
                    const Icon2 = ICON_MAP[item.feature2Icon ?? "Shield"] ?? Shield;
                    const Icon3 = ICON_MAP[item.feature3Icon ?? "Star"] ?? Star;
                    return (
                      <CarouselItem key={item.id}>
                        <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm glass">
                          <div className="absolute right-2 top-2 z-10">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                item.type === "free"
                                  ? "bg-chart-2 text-white"
                                  : "bg-amber-500 text-black"
                              }`}
                            >
                              {item.type === "free" ? "FREE" : "PREMIUM"}
                            </span>
                          </div>
                          <div className="relative">
                            {vidId ? (
                              <button
                                type="button"
                                className="relative aspect-video w-full overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                                onClick={() => openVideo(item)}
                              >
                                <img
                                  src={`https://img.youtube.com/vi/${vidId}/mqdefault.jpg`}
                                  alt=""
                                  className="h-full w-full object-cover transition group-hover:opacity-90"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/40">
                                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                                    <Play className="h-7 w-7 text-primary ml-1" />
                                  </div>
                                </div>
                              </button>
                            ) : (
                              <div className="aspect-video w-full bg-muted flex items-center justify-center">
                                <span className="text-muted-foreground text-sm">No video</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-4">
                            <h3 className="font-semibold text-lg">{item.scriptName}</h3>
                            <p className="text-sm text-muted-foreground">{item.gameName}</p>
                            <ul className="mt-3 space-y-1.5 text-sm">
                              <li className="flex items-center gap-2">
                                <Icon1 className="h-4 w-4 shrink-0 text-primary" />
                                {item.feature1Text}
                              </li>
                              <li className="flex items-center gap-2">
                                <Icon2 className="h-4 w-4 shrink-0 text-primary" />
                                {item.feature2Text}
                              </li>
                              <li className="flex items-center gap-2">
                                <Icon3 className="h-4 w-4 shrink-0 text-primary" />
                                {item.feature3Text}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
              <MobileCarouselControls api={showcaseApi} />
            </div>
            {/* Desktop grid */}
            <div className="hidden sm:grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => {
                const vidId = getYoutubeId(item.youtubeUrl);
                const Icon1 = ICON_MAP[item.feature1Icon ?? "Zap"] ?? Zap;
                const Icon2 = ICON_MAP[item.feature2Icon ?? "Shield"] ?? Shield;
                const Icon3 = ICON_MAP[item.feature3Icon ?? "Star"] ?? Star;
                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm glass"
                  >
                    <div className="absolute right-2 top-2 z-10">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.type === "free"
                            ? "bg-chart-2 text-white"
                            : "bg-amber-500 text-black"
                        }`}
                      >
                        {item.type === "free" ? "FREE" : "PREMIUM"}
                      </span>
                    </div>
                    {vidId ? (
                      <button
                        type="button"
                        className="relative aspect-video w-full overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                        onClick={() => openVideo(item)}
                      >
                        <img
                          src={`https://img.youtube.com/vi/${vidId}/mqdefault.jpg`}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:opacity-90"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/40">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                            <Play className="h-7 w-7 text-primary ml-1" />
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="aspect-video w-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No video</span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold text-lg">{item.scriptName}</h3>
                      <p className="text-sm text-muted-foreground">{item.gameName}</p>
                      <ul className="mt-3 space-y-1.5 text-sm">
                        <li className="flex items-center gap-2">
                          <Icon1 className="h-4 w-4 shrink-0 text-primary" />
                          {item.feature1Text}
                        </li>
                        <li className="flex items-center gap-2">
                          <Icon2 className="h-4 w-4 shrink-0 text-primary" />
                          {item.feature2Text}
                        </li>
                        <li className="flex items-center gap-2">
                          <Icon3 className="h-4 w-4 shrink-0 text-primary" />
                          {item.feature3Text}
                        </li>
                      </ul>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => likeMutation.mutate(item.id)}
                          className="inline-flex items-center gap-1 rounded-md p-1.5 hover:bg-muted hover:text-foreground"
                          title="Suka"
                        >
                          <Heart className="h-4 w-4" />
                          <span>{item.likeCount ?? 0}</span>
                        </button>
                        <span className="inline-flex items-center gap-1" title="Dilihat">
                          <Eye className="h-4 w-4" />
                          <span>{item.viewCount ?? 0}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => tipMutation.mutate(item.id)}
                          className="inline-flex items-center gap-1 rounded-md p-1.5 hover:bg-muted hover:text-foreground"
                          title="Tanda mata"
                        >
                          <Gift className="h-4 w-4" />
                          <span>{item.tipCount ?? 0}</span>
                        </button>
                      </div>
                      {item.buttonLabel && item.buttonUrl ? (
                        <div className="mt-4">
                          <Button className="w-full" asChild>
                            <a href={item.buttonUrl} target="_blank" rel="noopener noreferrer">
                              {item.buttonLabel}
                            </a>
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">No scripts match the selected filters.</p>
            )}
          </div>
        </section>
      )}

      {/* Video modal */}
      <Dialog open={!!videoModal} onOpenChange={() => setVideoModal(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Video</DialogTitle>
          </DialogHeader>
          {videoModal && (
            <div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  title="YouTube"
                  src={`https://www.youtube-nocookie.com/embed/${videoModal.vidId}`}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <div className="flex justify-center border-t bg-muted/50 p-3">
                <a
                  href={`https://www.youtube.com/watch?v=${videoModal.vidId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Play className="h-4 w-4" />
                  Tonton di YouTube
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Our Team */}
      {teams.length > 0 && (
        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="container px-4">
            <h2 className="font-serif text-3xl font-bold tracking-wide text-center mb-2">Our Team</h2>
            <p className="text-center text-muted-foreground mb-8 md:mb-10">Kenal lebih dekat dengan orang-orang di balik KingVypers</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((m) => (
                <div key={m.id} className="group relative rounded-xl border bg-card p-5 shadow-sm glass">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-muted ring-2 ring-background/60 shadow">
                      {m.photoUrl ? <img src={m.photoUrl} alt={m.fullName} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.fullName}</p>
                      <p className="truncate text-sm text-primary">{m.role}</p>
                    </div>
                  </div>
                  {m.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">{m.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[m.skill1, m.skill2, m.skill3, m.skill4].filter(Boolean).map((s, i) => (
                      <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs">{s}</span>
                    ))}
                  </div>
                  {(m.instagram || m.linkedin || m.github || m.twitter) && (
                    <div className="mt-4 flex items-center gap-3">
                      {m.instagram && (
                        <a href={m.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-foreground transition">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10zm-5 3a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7zm0 2a3 3 0 1 1-.001 6.001A3 3 0 0 1 12 9zm5.5-2.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0z"/></svg>
                        </a>
                      )}
                      {m.linkedin && (
                        <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground transition">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M19 3A2.94 2.94 0 0 1 22 6v12a2.94 2.94 0 0 1-3 3H5a2.94 2.94 0 0 1-3-3V6a2.94 2.94 0 0 1 3-3h14zM8.34 17v-6H6v6h2.34zM7.17 9.21a1.37 1.37 0 1 0 0-2.74 1.37 1.37 0 0 0 0 2.74zM18 17v-3.2c0-1.71-.9-2.8-2.35-2.8a2 2 0 0 0-1.8 1h-.06V11H11s.03.97 0 6H13.1v-3.36c0-.18.01-.36.07-.49.16-.36.53-.73 1.15-.73.81 0 1.14.55 1.14 1.36V17H18z"/></svg>
                        </a>
                      )}
                      {m.github && (
                        <a href={m.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-foreground transition">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 .5A12 12 0 0 0 0 12.62c0 5.35 3.44 9.88 8.2 11.48.6.12.82-.27.82-.6v-2.1c-3.34.74-4.04-1.65-4.04-1.65-.55-1.42-1.34-1.8-1.34-1.8-1.1-.78.08-.76.08-.76 1.22.09 1.87 1.28 1.87 1.28 1.08 1.9 2.84 1.35 3.53 1.03.11-.8.42-1.35.76-1.66-2.67-.31-5.48-1.38-5.48-6.14 0-1.36.46-2.47 1.22-3.34-.12-.31-.53-1.56.12-3.25 0 0 1-.33 3.3 1.27a11.1 11.1 0 0 1 6 0C16.4 4.19 17.4 4.52 17.4 4.52c.65 1.69.24 2.94.12 3.25.76.87 1.22 1.98 1.22 3.34 0 4.78-2.82 5.82-5.5 6.12.44.38.82 1.12.82 2.26v3.36c0 .33.22.73.83.6A12.13 12.13 0 0 0 24 12.62 12 12 0 0 0 12 .5z"/></svg>
                        </a>
                      )}
                      {m.twitter && (
                        <a href={m.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.2 4.2 0 0 0 1.85-2.33 8.27 8.27 0 0 1-2.64 1.01 4.14 4.14 0 0 0-7.06 3.78A11.74 11.74 0 0 1 3.15 4.9a4.12 4.12 0 0 0 1.28 5.52c-.64-.02-1.25-.2-1.78-.49v.05a4.15 4.15 0 0 0 3.32 4.07c-.3.08-.62.12-.95.12-.23 0-.46-.02-.68-.06a4.15 4.15 0 0 0 3.87 2.88A8.34 8.34 0 0 1 2 19.54 11.77 11.77 0 0 0 8.29 21c7.55 0 11.69-6.26 11.69-11.69l-.01-.53A8.36 8.36 0 0 0 22.46 6z"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container px-4">
          <h2 className="font-serif text-3xl font-bold tracking-wide text-center mb-12">
            Why KingVypers?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">HWID Binding</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                One key, one device. Keys bind to hardware ID so they can&apos;t be shared or leaked.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <Zap className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">Instant Validation</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Simple API for your Roblox executor. Validate keys in real time with clear success or error messages.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                <Key className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">Dashboard</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate keys, track revenue, blacklist abuse, and reset HWID—all from one dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container px-4 py-20">
        <h2 className="font-serif text-3xl font-bold tracking-wide text-center mb-12">
          How It Works
        </h2>
        <div className="mx-auto max-w-2xl space-y-6">
          {[
            { step: 1, title: "Get a key", desc: "Purchase a license key from the script seller (Discord, etc.)." },
            { step: 2, title: "Validate once", desc: "Enter your key in the executor or on this site. It binds to your device (HWID)." },
            { step: 3, title: "Use the script", desc: "As long as the key is active and not expired, you're good to go." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 rounded-lg border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step}
              </div>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-chart-2" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5 py-12 md:py-16">
        <div className="container px-4 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-wide">
            Already have a key?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Validate it here or check your key status.
          </p>
          <Link href="/validate">
            <Button size="lg" className="mt-5 md:mt-6">
              Validate Key
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <span className="text-sm text-muted-foreground">
            © KingVypers · Key Management System
          </span>
          <div className="flex gap-6">
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              Join Discord
            </a>
            <Link href="/validate" className="text-sm text-muted-foreground hover:text-foreground">
              Validate Key
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
