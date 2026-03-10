import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLogo } from "@/components/header-logo";
import type { Package } from "@shared/schema";

function formatIdr(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(String(value).replace(/,/g, "")) || 0 : Number(value);
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function BeliSekarang() {
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data: packages = [], isLoading } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
    queryFn: async () => {
      const res = await fetch("/api/packages");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const setQty = (id: number, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[id] ?? 1;
      const next = Math.max(1, Math.min(99, cur + delta));
      return { ...prev, [id]: next };
    });
  };

  const getQty = (id: number) => quantities[id] ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold tracking-wide">
            <HeaderLogo size="md" />
            KingVypers
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/beli">
              <Button variant="default" size="sm">Beli Sekarang</Button>
            </Link>
            <Link href="/validate">
              <Button variant="ghost" size="sm">Validate Key</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container px-4 py-12 md:py-16">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-center mb-2">Beli Key</h1>
        <p className="text-center text-muted-foreground mb-10">Pilih paket dan jumlah, lalu beli via Discord.</p>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Belum ada paket. Cek lagi nanti.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {packages.map((pkg) => {
              const qty = getQty(pkg.id);
              const features = [pkg.feature1, pkg.feature2, pkg.feature3, pkg.feature4].filter(Boolean);
              return (
                <div
                  key={pkg.id}
                  className="relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden"
                >
                  {pkg.isPopular ? (
                    <div className="absolute left-0 right-0 top-0 bg-primary py-1 text-center text-xs font-semibold text-primary-foreground">
                      Most Popular
                    </div>
                  ) : null}
                  <div className={pkg.isPopular ? "pt-8" : ""}>
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
                      <h2 className="font-semibold text-lg">{pkg.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{pkg.durationDays} hari</p>
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-xl font-bold">IDR {formatIdr(pkg.price ?? 0)}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Jumlah:</span>
                        <div className="flex items-center rounded-lg border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => setQty(pkg.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="min-w-[2rem] text-center text-sm font-medium">{qty}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => setQty(pkg.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
        )}

        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="outline">Kembali ke Beranda</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
