import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import {
  ScanLine,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  IndianRupee,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Search,
} from "lucide-react";

interface CartItem {
  productId: number;
  name: string;
  category: string;
  unitPrice: number;
  gstRate: number;
  quantity: number;
}

export default function Billing() {
  useAuth({ redirectOnUnauthenticated: true });
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [complete, setComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Fetch retailer details for store name and UPI ID
  const { data: retailer } = trpc.retailer.myRetailer.useQuery(undefined);

  // Debounced search for product queries
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch products matching search query
  const { data: matchedDbProducts } = trpc.inventory.searchBillingProducts.useQuery(
    { query: debouncedSearch },
    { enabled: debouncedSearch.length >= 1 }
  );

  const createBill = trpc.bill.create.useMutation({
    onSuccess: () => {
      setComplete(true);
    },
  });

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const data = await utils.inventory.scanProductByBarcode.fetch({ barcode });
      if (data) {
        const product = data.product;
        const inv = data.inventoryItem;
        const price = inv?.sellingPrice ? parseFloat(inv.sellingPrice) : parseFloat(product.mrp);
        const gstRate = parseFloat(product.gstRate || "0");

        addToCart({
          id: product.id,
          name: product.name,
          category: product.category,
          mrp: price,
          gstRate,
        });
      } else {
        alert(`Product with barcode "${barcode}" not found in master catalog.`);
      }
    } catch (err) {
      console.error("Barcode scan lookup failed", err);
    } finally {
      setShowScanner(false);
    }
  };

  const addToCart = (product: { id: number; name: string; category: string; mrp: number; gstRate: number }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          unitPrice: product.mrp,
          gstRate: product.gstRate,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const gstAmount = cart.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity * item.gstRate) / 100,
    0
  );
  const total = subtotal + gstAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    createBill.mutate({
      paymentMethod,
      items: cart.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
      })),
      discount: 0,
    });
  };

  const filteredProducts = matchedDbProducts
    ? matchedDbProducts.map((p: any) => {
        const price = p.inventoryItem?.sellingPrice
          ? parseFloat(p.inventoryItem.sellingPrice)
          : parseFloat(p.product.mrp);
        return {
          id: p.product.id,
          name: p.product.name,
          category: p.product.category,
          barcode: p.product.barcode || "",
          mrp: price,
          gstRate: parseFloat(p.product.gstRate || "0"),
        };
      })
    : [];

  if (complete) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
        <Navigation />
        <div className="pt-24 px-4 flex flex-col items-center justify-center min-h-[85vh] print:pt-0">
          <div className="text-center w-full max-w-sm print:hidden">
            <div className="w-16 h-16 rounded-full bg-[#00ca48]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#00ca48]" />
            </div>
            <h2 className="shutter-heading text-[24px] mb-1" style={{ color: "var(--color-charcoal-primary)" }}>
              Payment Complete!
            </h2>
            <p className="text-[12px] text-[#848281] mb-6">
              Inventory updated automatically. Preview your receipt below:
            </p>
          </div>

          {/* Receipt View Container */}
          <div className="bg-white p-6 rounded-2xl border border-[#f2f0ed] text-left font-mono text-[12px] shadow-sm w-full max-w-[320px] mx-auto mb-6 print-receipt print:border-0 print:shadow-none print:p-0 print:my-0">
            <div className="text-center mb-4">
              <h4 className="font-bold text-[14px] uppercase text-[#121212] tracking-tight">
                {retailer?.storeName || "Shutter Kirana"}
              </h4>
              <p className="text-[11px] text-[#848281] mt-0.5">
                {retailer?.address || "Mumbai, Maharashtra"}
              </p>
              {retailer?.phone && (
                <p className="text-[11px] text-[#848281]">Tel: {retailer.phone}</p>
              )}
              {retailer?.gstin && (
                <p className="text-[11px] text-[#848281]">GSTIN: {retailer.gstin}</p>
              )}
              <div className="border-b border-dashed border-[#c6c6c6] my-3"></div>
              <div className="flex justify-between text-[11px] text-[#474645]">
                <span>Bill No: B{Date.now().toString().slice(-6)}</span>
                <span>{new Date().toLocaleDateString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between text-[#121212]">
                  <div className="flex-1 pr-4">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-[10px] text-[#848281]">
                      {item.quantity} × ₹{item.unitPrice.toFixed(2)}
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold">
                    ₹{(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-[#c6c6c6] my-3"></div>

            <div className="space-y-1.5 text-[#474645]">
              <div className="flex justify-between text-[11px]">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>GST ({gstAmount > 0 ? "Included" : "0%"})</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-[#c6c6c6] pt-1.5 flex justify-between font-bold text-[14px] text-[#121212]">
                <span>GRAND TOTAL</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-[#c6c6c6] my-3"></div>

            <div className="text-center text-[10px] text-[#848281] uppercase leading-relaxed">
              Paid via {paymentMethod.toUpperCase()}
              <br />
              Thank you for shopping!
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-[320px] flex flex-col gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="shutter-btn-dark w-full bg-[#00ca48] hover:bg-[#00b03e] text-white flex items-center justify-center gap-2"
            >
              Print Receipt
            </button>
            <button
              onClick={() => {
                setCart([]);
                setComplete(false);
                setShowReview(false);
              }}
              className="shutter-btn-dark w-full"
            >
              New Bill
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="shutter-btn-light w-full"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Global Print-only Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-receipt, .print-receipt * {
              visibility: visible;
            }
            .print-receipt {
              position: absolute;
              left: 50%;
              top: 0;
              transform: translateX(-50%);
              width: 80mm;
              max-width: 100%;
              margin: 0 auto;
              padding: 0;
              border: 0 !important;
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="shutter-heading text-[32px]" style={{ color: "var(--color-charcoal-primary)" }}>
                QR Billing
              </h1>
              <p className="text-[13px] text-[#848281]">Scan products or search to add to cart</p>
            </div>
            <div className="text-right">
              <div className="text-[24px] font-semibold text-[#121212]">₹{total.toFixed(2)}</div>
              <div className="text-[11px] text-[#848281]">{cart.length} items</div>
            </div>
          </div>

          {/* Scanner */}
          <div className="shutter-card-cream p-4 mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setShowScanner(true)}
                className="shutter-btn-dark flex items-center gap-2 shrink-0"
              >
                <ScanLine className="w-4 h-4" />
                Scan Barcode
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c6c6c6]" />
                <input
                  type="text"
                  placeholder="Search product or enter barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                />
              </div>
            </div>

            {/* Search Results */}
            {filteredProducts.length > 0 && (
              <div className="mt-3 space-y-1 max-h-[200px] overflow-y-auto">
                {filteredProducts.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addToCart(product);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors text-left"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-[#343433]">{product.name}</div>
                      <div className="text-[11px] text-[#848281]">{product.category}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-[#ff3e00]">₹{product.mrp}</span>
                      <Plus className="w-4 h-4 text-[#00ca48]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="shutter-card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-[#ff3e00]" />
              <h3 className="text-[15px] font-semibold text-[#343433]">Cart Items</h3>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ScanLine className="w-10 h-10 text-[#c6c6c6] mx-auto mb-3" />
                <p className="text-[13px] text-[#848281]">
                  Scan a product or search to add items
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f7f4]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-[#343433] truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#848281]">{item.category}</div>
                      <div className="text-[13px] text-[#ff3e00] font-medium mt-0.5">
                        ₹{item.unitPrice.toFixed(2)}
                        {item.gstRate > 0 && (
                          <span className="text-[10px] text-[#848281] ml-1">
                            +{item.gstRate}% GST
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex items-center gap-1 bg-white rounded-full border border-[#f2f0ed]">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f2f0ed] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[13px] font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f2f0ed] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#ff2b3a]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#848281] hover:text-[#ff2b3a]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary & Checkout */}
          {cart.length > 0 && (
            <div className="shutter-card">
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#848281]">Subtotal</span>
                  <span className="font-medium text-[#474645]">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#848281]">GST</span>
                  <span className="font-medium text-[#474645]">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#f2f0ed] pt-2 flex justify-between">
                  <span className="text-[15px] font-semibold text-[#121212]">Total</span>
                  <span className="text-[18px] font-bold text-[#121212]">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-5">
                <label className="text-[12px] font-medium text-[#848281] uppercase tracking-wide mb-2 block">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "cash" as const, label: "Cash", icon: Banknote },
                    { value: "upi" as const, label: "UPI", icon: Smartphone },
                    { value: "card" as const, label: "Card", icon: CreditCard },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                        paymentMethod === method.value
                          ? "border-[#121212] bg-[#121212] text-white"
                          : "border-[#f2f0ed] bg-white text-[#474645] hover:bg-[#f8f7f4]"
                      }`}
                    >
                      <method.icon className="w-5 h-5" />
                      <span className="text-[12px] font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowReview(true)}
                className="w-full shutter-btn-dark flex items-center justify-center gap-2 py-3"
              >
                <ShoppingBag className="w-4 h-4" />
                Review Order
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            handleBarcodeScan(barcode);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Review Order Modal */}
      {showReview && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-semibold text-[#121212]">Review Order</h3>
              <button
                onClick={() => setShowReview(false)}
                className="w-8 h-8 rounded-full bg-[#f8f7f4] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between py-2 border-b border-[#f2f0ed] last:border-0">
                  <div>
                    <div className="text-[13px] font-medium text-[#343433]">{item.name}</div>
                    <div className="text-[11px] text-[#848281]">Qty: {item.quantity} × ₹{item.unitPrice}</div>
                  </div>
                  <div className="text-[13px] font-medium text-[#474645]">
                    ₹{(item.unitPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#f8f7f4] rounded-xl p-4 mb-5 space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#848281]">Subtotal</span>
                <span className="text-[#474645]">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#848281]">GST</span>
                <span className="text-[#474645]">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-[#f2f0ed] pt-2 flex justify-between">
                <span className="font-semibold text-[#121212]">Total</span>
                <span className="font-bold text-[18px] text-[#121212]">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* UPI QR Payment Block */}
            {paymentMethod === "upi" && (
              <>
                {!retailer?.upiId ? (
                  <div className="bg-[#ff3e00]/10 text-[#ff3e00] rounded-xl p-4 mb-5 text-[12px] leading-relaxed">
                    ⚠️ <strong>UPI ID not configured!</strong> Please configure your UPI ID on the{" "}
                    <a href="/profile" className="underline font-semibold hover:text-[#ff3e00]/80">
                      Profile Page
                    </a>{" "}
                    to accept checkout QR payments.
                  </div>
                ) : (
                  <div className="flex flex-col items-center bg-white p-4 rounded-xl border border-[#f2f0ed] mb-5 text-center">
                    <div className="text-[12px] font-semibold text-[#121212] mb-1">
                      UPI Payment QR Code
                    </div>
                    <div className="text-[11px] text-[#848281] mb-4">
                      Scan using Google Pay, PhonePe, Paytm, or BHIM
                    </div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(
                        `upi://pay?pa=${retailer.upiId}&pn=${encodeURIComponent(
                          retailer.storeName
                        )}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
                          `Purchase B${Date.now().toString().slice(-6)}`
                        )}`
                      )}`}
                      alt="UPI Payment QR Code"
                      className="w-[180px] h-[180px] border border-[#f2f0ed] rounded-lg shadow-sm"
                    />
                    <div className="text-[14px] font-bold text-[#121212] mt-3">
                      ₹{total.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#848281] font-mono mt-1">
                      {retailer.upiId}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 mb-4 text-[12px] text-[#848281]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ca48]" />
              Payment via {paymentMethod.toUpperCase()}
            </div>

            <button
              onClick={handleCheckout}
              disabled={createBill.isPending || (paymentMethod === "upi" && !retailer?.upiId)}
              className="w-full shutter-btn-dark py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createBill.isPending ? (
                "Processing..."
              ) : (
                <>
                  <IndianRupee className="w-4 h-4" />
                  Confirm Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
