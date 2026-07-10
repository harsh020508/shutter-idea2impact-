import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import {
  Plus,
  CheckCircle2,
  X,
  TrendingUp,
  Store,
  Package,
  Tag,
} from "lucide-react";

export default function Campaigns() {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState<"new_store" | "product_category" | "brand">("new_store");
  const [category, setCategory] = useState("");
  const [targetSigs, setTargetSigs] = useState(50);

  const { data: campaigns, refetch: refetchCampaigns } = trpc.campaign.list.useQuery({});

  const deviceId = useMemo(() => {
    let id = localStorage.getItem("shutter_device_id");
    if (!id) {
      id = `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("shutter_device_id", id);
    }
    return id;
  }, []);

  const createCampaign = trpc.campaign.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setCategory("");
      refetchCampaigns();
    },
  });

  const signCampaign = trpc.campaign.sign.useMutation({
    onSuccess: () => {
      refetchCampaigns();
    },
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1000px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <BlobCharacter color="purple" size={56} expression="happy" delay={1} />
              </div>
              <div>
                <h1 className="shutter-heading text-[32px]" style={{ color: "var(--color-charcoal-primary)" }}>
                  Community Campaigns
                </h1>
                <p className="text-[13px] text-[#848281]">
                  Crowdsource retail needs in your neighborhood
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="shutter-btn-dark flex items-center gap-2 text-[13px] self-start"
            >
              <Plus className="w-4 h-4" />
              Start Campaign
            </button>
          </div>

          {/* Campaigns Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns && campaigns.length > 0 ? (
              campaigns.map((campaign: any) => {
                const progress = Math.round((campaign.currentSignatures / campaign.targetSignatures) * 100);
                const isNearTarget = progress >= 80;

                return (
                  <div key={campaign.id} className="shutter-card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                          campaign.requestType === "new_store"
                            ? "bg-[#0090ff]/10 text-[#0090ff]"
                            : campaign.requestType === "product_category"
                            ? "bg-[#00ca48]/10 text-[#00ca48]"
                            : "bg-[#ffbb26]/10 text-[#d48f00]"
                        }`}
                      >
                        {campaign.requestType === "new_store"
                          ? "New Store"
                          : campaign.requestType === "product_category"
                          ? "Product Category"
                          : "Brand Request"}
                      </div>
                      {isNearTarget && (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-[#00ca48]">
                          <TrendingUp className="w-3 h-3" />
                          Near Target
                        </div>
                      )}
                    </div>

                    <h3 className="text-[16px] font-semibold text-[#343433] mb-2">
                      {campaign.title}
                    </h3>
                    <p className="text-[13px] text-[#848281] mb-4 line-clamp-2">
                      {campaign.description}
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1 text-[12px] text-[#848281]">
                        <Tag className="w-3 h-3" />
                        {campaign.category}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-[#848281]">
                          {campaign.currentSignatures} of {campaign.targetSignatures} signatures
                        </span>
                        <span className="text-[11px] font-semibold text-[#0090ff]">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#f2f0ed] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isNearTarget
                              ? "bg-gradient-to-r from-[#00ca48] to-[#00ca48]"
                              : "bg-gradient-to-r from-[#0090ff] to-[#00ca48]"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => signCampaign.mutate({ campaignId: campaign.id, deviceId })}
                      disabled={signCampaign.isPending}
                      className="w-full py-2.5 rounded-full bg-[#f8f7f4] text-[13px] font-medium text-[#474645] hover:bg-[#121212] hover:text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sign Campaign
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-12 text-[#848281] text-[14px]">
                No active campaigns in this area. Be the first to start one!
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-semibold text-[#121212]">Start a Campaign</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-full bg-[#f8f7f4] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Organic Store in Koramangala"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what you need and why..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20 resize-none"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Request Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "new_store" as const, label: "New Store", icon: Store },
                    { value: "product_category" as const, label: "Category", icon: Package },
                    { value: "brand" as const, label: "Brand", icon: Tag },
                  ]).map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setRequestType(type.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-colors ${
                        requestType === type.value
                          ? "border-[#121212] bg-[#121212] text-white"
                          : "border-[#f2f0ed] text-[#474645] hover:bg-[#f8f7f4]"
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      <span className="text-[11px] font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Organic Foods"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Target Signatures: {targetSigs}
                </label>
                <input
                  type="range"
                  min={10}
                  max={200}
                  value={targetSigs}
                  onChange={(e) => setTargetSigs(Number(e.target.value))}
                  className="w-full accent-[#ff3e00]"
                />
              </div>

              <button
                onClick={() =>
                  createCampaign.mutate({
                    title,
                    description,
                    requestType,
                    category,
                    targetSignatures: targetSigs,
                  })
                }
                disabled={!title || !category || createCampaign.isPending}
                className="w-full shutter-btn-dark py-3 disabled:opacity-50"
              >
                {createCampaign.isPending ? "Creating..." : "Launch Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
