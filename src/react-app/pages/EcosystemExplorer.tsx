import { useState, useEffect } from "react";
import EcosystemNav from "@/react-app/components/EcosystemNav";

interface Brand {
  name: string;
  subNodes: string[];
  masterLicensePrice?: number;
}

interface SectorData {
  key: string;
  name: string;
  displayName: string;
  description: string;
  nodes: number;
  revenue: number;
  dominanceScore: number;
  brands: Brand[];
  coreLogic?: string;
  keyBenefits?: string;
  economicModel?: string;
  scrollProfiles?: Array<{ name: string; link: string }>;
}

export default function EcosystemExplorer() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [sectorDetail, setSectorDetail] = useState<SectorData | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    if (selectedSector) {
      fetchSectorDetail(selectedSector);
    }
  }, [selectedSector]);

  const fetchSectors = async () => {
    try {
      const response = await fetch("/api/ecosystem/sectors");
      const data = await response.json();
      setSectors(data);
      if (data.length > 0) {
        setSelectedSector(data[0].key);
      }
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const fetchSectorDetail = async (sectorKey: string) => {
    try {
      const response = await fetch(`/api/ecosystem/sectors/${sectorKey}`);
      const data = await response.json();
      setSectorDetail(data);
      setShowInsight(false);
      setAiInsight("");
    } catch (error) {
      console.error("Error fetching sector detail:", error);
    }
  };

  const getAiInsight = async () => {
    if (!sectorDetail) return;

    setLoading(true);
    setShowInsight(true);
    setAiInsight("");

    try {
      const prompt = `Provide a concise, 2-3 sentence overview of the "${sectorDetail.name}" sector within a technological ecosystem, focusing on its key functions and impact.`;
      const response = await fetch("/api/ecosystem/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setAiInsight(data.text || "Failed to fetch AI insights. Please try again.");
    } catch (error) {
      console.error("Error getting AI insight:", error);
      setAiInsight("Failed to fetch AI insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <EcosystemNav />
      <main className="container mx-auto p-4 md:p-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8 md:p-16 mb-8 text-center shadow-2xl">
          <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg">
            Ecosystem Explorer
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            Dive into specific sectors and monitor their brand performance and node health.
          </p>
          <div className="w-full max-w-2xl mx-auto">
            <iframe
              className="rounded-xl w-full"
              src="https://open.spotify.com/embed/track/24KoWEhhUGmnTofg0UAgbO?utm_source=generator"
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        </section>

        {/* Sector Selection */}
        <section className="mb-8">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
            <label
              htmlFor="sectorFilter"
              className="block text-lg font-medium text-gray-300 mb-4"
            >
              Select Sector:
            </label>
            <select
              id="sectorFilter"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            >
              {sectors.map((sector) => (
                <option key={sector.key} value={sector.key}>
                  {sector.displayName}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Sector Details */}
        {sectorDetail && (
          <div className="space-y-8">
            {/* Overview */}
            <div className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-4">
                {sectorDetail.name} Overview
              </h3>
              <p className="text-gray-300 mb-6 text-lg">{sectorDetail.description}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-gray-700">
                <h4 className="text-base font-semibold text-blue-400 mb-2">Active Nodes</h4>
                <p className="text-4xl font-black text-green-400">
                  {sectorDetail.nodes.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 mt-2">active product nodes</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-gray-700">
                <h4 className="text-base font-semibold text-blue-400 mb-2">
                  Current Revenue (Annual)
                </h4>
                <p className="text-4xl font-black text-green-400">
                  ${(sectorDetail.revenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-gray-400 mt-2">estimated annual revenue</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-gray-700">
                <h4 className="text-base font-semibold text-blue-400 mb-2">
                  Sector Dominance Index
                </h4>
                <p className="text-4xl font-black text-green-400">
                  {sectorDetail.dominanceScore} / 100
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  influence and strategic importance
                </p>
              </div>
            </div>

            {/* Core Logic & Benefits */}
            {(sectorDetail.coreLogic || sectorDetail.keyBenefits) && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold text-green-400 text-center mt-12 mb-6">
                  Core Logic & Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sectorDetail.coreLogic && (
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                      <h4 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <span className="text-2xl">💡</span> Core Logic:
                      </h4>
                      <div
                        className="text-gray-300 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: sectorDetail.coreLogic }}
                      />
                    </div>
                  )}
                  {sectorDetail.keyBenefits && (
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                      <h4 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <span className="text-2xl">✨</span> Key Benefits:
                      </h4>
                      <div
                        className="text-gray-300 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: sectorDetail.keyBenefits }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Economic Model */}
            {sectorDetail.economicModel && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold text-green-400 text-center mt-12 mb-6">
                  Economic Model & Royalty Principles
                </h3>
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                  <div
                    className="text-gray-300 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sectorDetail.economicModel }}
                  />
                </div>
              </>
            )}

            {/* Brands */}
            {sectorDetail.brands.length > 0 && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold text-green-400 text-center mt-12 mb-6">
                  Brands & Sub-nodes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sectorDetail.brands.map((brand, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 rounded-lg p-6 text-center transition-all duration-300 hover:bg-gray-700 hover:-translate-y-1 hover:shadow-xl cursor-pointer border border-gray-700 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="text-5xl mb-4">
                          {sectorDetail.displayName?.split(" ")[0] || "🔷"}
                        </div>
                        <h3 className="text-xl font-bold text-green-400 mb-2">
                          {brand.name}
                        </h3>
                        {brand.masterLicensePrice && (
                          <>
                            <p className="text-2xl font-semibold text-green-300 mb-1">
                              ${brand.masterLicensePrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400 mb-4">Master License Fee</p>
                          </>
                        )}
                        {brand.subNodes.length > 0 && (
                          <ul className="mt-4 space-y-1 text-left border-t border-gray-600 pt-4 max-h-0 group-hover:max-h-48 overflow-hidden transition-all duration-500">
                            {brand.subNodes.map((node, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-400 flex items-start gap-2"
                              >
                                <span className="text-green-400 mt-0.5">•</span>
                                <span>{node}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Scroll Profiles */}
            {sectorDetail.scrollProfiles && sectorDetail.scrollProfiles.length > 0 && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold text-green-400 text-center mt-12 mb-6">
                  Key Documents & Manuals
                </h3>
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                  <ul className="space-y-2">
                    {sectorDetail.scrollProfiles.map((profile, index) => (
                      <li key={index}>
                        <a
                          href={profile.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2"
                        >
                          <span>📄</span>
                          <span>{profile.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* AI Insights */}
            <div className="text-center mt-12">
              <button
                onClick={getAiInsight}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
              >
                Get AI Insights for {sectorDetail.name}
              </button>
              {showInsight && (
                <div className="mt-6 p-6 bg-gray-800 rounded-lg text-left border border-gray-700 shadow-lg">
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400" />
                    </div>
                  ) : (
                    <p className="text-gray-300">{aiInsight}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
