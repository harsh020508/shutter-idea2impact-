import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
  ArrowRight,
  ScanLine,
} from "lucide-react";

export default function Inventory() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [threshold, setThreshold] = useState(5);


  const { data: inventory, refetch } = trpc.inventory.myInventory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: searchResults } = trpc.inventory.searchProducts.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const upsertItem = trpc.inventory.upsert.useMutation({
    onSuccess: () => {
      refetch();
      setShowAdd(false);
      setSearchQuery("");
      setSelectedProduct(null);
      setQuantity(10);
      setThreshold(5);
    },
  });

  const removeItem = trpc.inventory.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const filteredInventory = inventory?.filter((item: any) =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = inventory?.filter(
    (item: any) => item.inventory.quantity <= item.inventory.lowStockThreshold
  ) ?? [];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="shutter-heading text-[32px]" style={{ color: "var(--color-charcoal-primary)" }}>
                Inventory
              </h1>
              <p className="text-[13px] text-[#848281]">
                {inventory?.length || 0} products tracked
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={() => setShowScanner(true)}
                className="shutter-btn-light flex items-center gap-2 text-[13px]"
              >
                <ScanLine className="w-4 h-4" />
                Scan Barcode
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="shutter-btn-dark flex items-center gap-2 text-[13px]"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Low Stock Banner */}
          {lowStockItems.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-[#ffbb26]/10 border border-[#ffbb26]/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#ffbb26] shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-[#343433]">
                  {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} running low
                </div>
                <div className="text-[11px] text-[#848281]">
                  Review and restock soon
                </div>
              </div>
              <a href="/restock" className="ml-auto shutter-ghost-link text-[12px] flex items-center gap-1">
                AI Restock <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c6c6c6]" />
            <input
              type="text"
              placeholder="Search your inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#f2f0ed] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
            />
          </div>

          {/* Inventory List */}
          <div className="space-y-2">
            {(searchQuery ? filteredInventory : inventory)?.map((item: any) => {
              const isLow = item.inventory.quantity <= item.inventory.lowStockThreshold;
              const stockPercent = Math.min(
                100,
                (item.inventory.quantity / (item.inventory.lowStockThreshold * 3)) * 100
              );

              return (
                <div
                  key={item.inventory.id}
                  className="shutter-card py-4 px-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isLow ? "bg-[#ff3e00]/10" : "bg-[#00ca48]/10"
                    }`}
                  >
                    {isLow ? (
                      <AlertTriangle className="w-5 h-5 text-[#ff3e00]" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-[#00ca48]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-[#343433] truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-[#848281]">
                      {item.product.category}
                      {item.inventory.surplusFlag !== "normal" && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-[#ffbb26]/10 text-[#d48f00] text-[10px]">
                          {item.inventory.surplusFlag}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 w-full max-w-[200px] h-1.5 bg-[#f2f0ed] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? "bg-[#ff3e00]" : "bg-[#00ca48]"
                        }`}
                        style={{ width: `${stockPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-[16px] font-semibold ${isLow ? "text-[#ff3e00]" : "text-[#121212]"}`}>
                      {item.inventory.quantity}
                    </div>
                    <div className="text-[10px] text-[#848281]">
                      min: {item.inventory.lowStockThreshold}
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem.mutate({ id: item.inventory.id })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#ff2b3a]/10 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4 text-[#848281] hover:text-[#ff2b3a]" />
                  </button>
                </div>
              );
            })}

            {inventory?.length === 0 && (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-[#c6c6c6] mx-auto mb-4" />
                <p className="text-[15px] text-[#848281] mb-2">No inventory items yet</p>
                <p className="text-[12px] text-[#c6c6c6] mb-6">
                  Add products to start tracking your stock
                </p>
                <button onClick={() => setShowAdd(true)} className="shutter-btn-dark">
                  Add Your First Product
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            setShowScanner(false);
            setShowAdd(true);
            setSearchQuery(barcode);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-semibold text-[#121212]">Add to Inventory</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full bg-[#f8f7f4] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                Search Product
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c6c6c6]" />
                <input
                  type="text"
                  placeholder="Type product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                />
              </div>
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="mb-4 space-y-1 max-h-[180px] overflow-y-auto border border-[#f2f0ed] rounded-xl p-1">
                {searchResults.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product.id)}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-colors ${
                      selectedProduct === product.id
                        ? "bg-[#121212] text-white"
                        : "hover:bg-[#f8f7f4]"
                    }`}
                  >
                    <div>
                      <div className="text-[13px] font-medium">{product.name}</div>
                      <div className={`text-[11px] ${selectedProduct === product.id ? "text-white/60" : "text-[#848281]"}`}>
                        {product.category} — ₹{product.mrp}
                      </div>
                    </div>
                    {selectedProduct === product.id && (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedProduct && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min={0}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      min={1}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                    />
                  </div>
                </div>

                <button
                  onClick={() =>
                    selectedProduct &&
                    upsertItem.mutate({
                      productId: selectedProduct,
                      quantity,
                      lowStockThreshold: threshold,
                    })
                  }
                  disabled={upsertItem.isPending}
                  className="w-full shutter-btn-dark py-3 disabled:opacity-50"
                >
                  {upsertItem.isPending ? "Adding..." : "Add to Inventory"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
